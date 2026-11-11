"""Account isolation and catalog adapter, independent of HA's transport."""

import re
from urllib.parse import urlsplit


class AccessError(ValueError):
    """A configuration or access problem that can be shown to the caller."""

    def __init__(self, code, message):
        super().__init__(message)
        self.code = code


def value(obj, key, default=None):
    """Read model objects and dictionaries without serializing private fields."""
    return obj.get(key, default) if isinstance(obj, dict) else getattr(obj, key, default)


def enum_value(item):
    return getattr(item, "value", item)


def is_supported_user(user):
    """Allow active personal accounts without changing their MA role."""
    return bool(user and value(user, "enabled", False)
                and enum_value(value(user, "role")) in {"user", "admin"})


def account_for(accounts, ha_user_id):
    """Require a unique 1:1 assignment; never fall back to a default account."""
    matches = [a for a in accounts if a.get("ha_user_id") == ha_user_id]
    if len(matches) != 1:
        raise AccessError("not_mapped", "Für deinen HA-Benutzer ist noch kein Apple-Music-Konto zugeordnet. Ein Administrator kann dies unter Geräte & Dienste → Music Manager → Konfigurieren festlegen.")
    account = matches[0]
    if not account.get("ma_user_id") or not account.get("provider_id") or any(
        a is not account and (
            a.get("ma_user_id") == account["ma_user_id"]
            or a.get("provider_id") == account["provider_id"]
        ) for a in accounts
    ):
        raise AccessError("duplicate_mapping", "Die Kontozuordnung muss eindeutig 1:1 sein. Bitte die Zuordnung in Music Manager korrigieren.")
    return account


async def checked_account(mass, account):
    """Recheck restrictions on every command, including after provider deletion."""
    user = await mass.auth.get_user(account["ma_user_id"])
    if not is_supported_user(user):
        raise AccessError("account_disabled", "Der zugeordnete Music-Assistant-Benutzer muss aktiv sein und die Rolle Benutzer oder Administrator haben.")
    # MA applies this source filter to administrator and regular user requests.
    # Keep it exact for both roles; never infer an account from an empty filter.
    if set(value(user, "provider_filter", []) or []) != {account["provider_id"]}:
        raise AccessError("account_filter", "Beschränke diesen Benutzer in Music Assistant unter Musikquellen auf genau sein zugeordnetes Apple-Music-Konto.")
    provider = next((p for p in mass.providers if value(p, "instance_id") == account["provider_id"]), None)
    if not provider or value(provider, "domain") != "apple_music" or not value(provider, "available", False):
        raise AccessError("provider_unavailable", "Das zugeordnete Apple-Music-Konto ist nicht verfügbar. Bitte die Anmeldung in Music Assistant prüfen.")
    return user, provider


def sonos_uid(unique_id):
    """Recognize a Sonos hardware UID, even with a provider prefix."""
    match = re.search(r"rincon_[a-z0-9]+", str(unique_id).lower())
    return match.group(0) if match else None


def validate_uri(uri, provider_id):
    """Accept only direct items from this exact provider instance."""
    provider, separator, path = str(uri).partition("://")
    media_type, slash, item_id = path.partition("/")
    if (not separator or not slash or provider != provider_id
        or media_type not in {"track", "album", "playlist"}
        or not re.fullmatch(r"[a-zA-Z0-9._-]{1,256}", item_id)):
        raise AccessError("invalid_media", "Dieser Eintrag gehört nicht zu deinem Apple-Music-Konto.")
    return uri


def catalog_item(item, provider_id):
    """Only expose metadata and an exact-account URI, no other mappings."""
    media_type = enum_value(value(item, "media_type"))
    if media_type not in {"track", "album", "playlist"}:
        return None
    provider = value(item, "provider")
    item_id = value(item, "item_id") if provider == provider_id else None
    for mapping in value(item, "provider_mappings", []) or []:
        if value(mapping, "provider_instance") == provider_id and value(mapping, "available", True):
            item_id = value(mapping, "item_id")
            break
    if not item_id:
        return None
    uri = f"{provider_id}://{media_type}/{item_id}"
    try:
        validate_uri(uri, provider_id)
    except AccessError:
        return None
    artists = value(item, "artists", []) or []
    description = ", ".join(str(value(a, "name", "")) for a in artists)
    label = {"track": "Titel", "album": "Album", "playlist": "Playlist"}[media_type]
    result = {"uri": uri, "title": str(value(item, "name", "Unbekannter Eintrag")),
            "description": f"{description} · {label}" if description else label,
            "media_type": media_type}
    # Expose only a public remote cover, never private metadata or a local MA
    # image proxy URL that cannot load through a remote HA connection.
    for image in value(value(item, "metadata"), "images", []) or []:
        path = value(image, "path", "")
        if enum_value(value(image, "type")) != "thumb" or not value(image, "remotely_accessible", False) or not isinstance(path, str) or len(path) > 4096:
            continue
        try:
            parsed = urlsplit(path)
            if parsed.scheme == "https" and parsed.hostname and not parsed.username and not parsed.password:
                result["thumbnail"] = path
                break
        except ValueError:
            continue
    return result


async def library(mass, account, media_type, offset=0):
    methods = {"track": mass.music.get_library_tracks, "album": mass.music.get_library_albums,
               "playlist": mass.music.get_library_playlists}
    if media_type not in methods:
        raise AccessError("invalid_media", "Unbekannte Mediathekansicht.")
    items = await methods[media_type](provider=account["provider_id"], user=account["ma_user_id"],
                                     limit=50, offset=offset, order_by="sort_name")
    return {"items": [result for item in items if (result := catalog_item(item, account["provider_id"]))],
            "more": len(items) == 50, "next_offset": offset + len(items)}


async def search(mass, account, query):
    results = await mass.music.search(query, media_types=["track", "album", "playlist"],
                                      limit=20, library_only=False, user=account["ma_user_id"])
    items = [item for key in ("tracks", "albums", "playlists") for item in value(results, key, [])]
    return {"items": [result for item in items if (result := catalog_item(item, account["provider_id"]))],
            "more": False}
