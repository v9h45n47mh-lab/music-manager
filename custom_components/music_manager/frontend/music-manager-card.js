/* Music Manager 1.10.0 | MIT | HA UI Kit 1.3.1 bundled locally, unchanged | See LICENSES.txt */
const MusicManagerUI = (() => {
/* HA UI Kit 1.3.1 | MIT | Source priority: Shutter, Light, Essensplaner, Haushalt, Spuelmaschine, Access */
const UI_VERSION = "1.3.1";
const UI_CSS = ":host{--fui-font-body:14px;--fui-icon:21px;--fui-touch:40px;--fui-section-padding:10px;--fui-row-padding:4px}\n/* Shared ShadowRoot styles. Values follow Shutter Manager 1.4.0. */\n:host{display:block;color:var(--primary-text-color,#212121);font-family:var(--ha-font-family-body,Roboto,Arial,sans-serif);font-size:var(--fui-font-body);line-height:1.4}\n*{box-sizing:border-box}\nha-card,.ui-card{display:block;background:var(--ha-card-background,var(--card-background-color,#fff));border:var(--ha-card-border-width,1px) solid var(--ha-card-border-color,var(--divider-color,#e0e0e0));border-radius:var(--ha-card-border-radius,12px);box-shadow:var(--ha-card-box-shadow,none);overflow:hidden}\nh3,h4,p{margin:0}h3{font-size:16px;font-weight:500}small,.hint{font-size:12px;line-height:1.5;color:var(--secondary-text-color,#727272)}\nbutton,input,select,textarea{font:inherit}\nbutton{color:var(--primary-color,#03a9f4);border:0;background:transparent;border-radius:var(--ha-button-border-radius,20px);padding:9px 14px;cursor:pointer;line-height:1.35;font-weight:500}\nbutton:hover{background:color-mix(in srgb,var(--primary-color,#03a9f4) 8%,transparent)}\nbutton:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:2px solid var(--primary-color,#03a9f4);outline-offset:2px}\nbutton:disabled{opacity:.45;cursor:default}button:disabled:hover{background:transparent}\nbutton.primary{background:var(--primary-color,#03a9f4);color:var(--text-primary-color,#fff)}button.danger{color:var(--error-color,#db4437)}\nbutton>.ui-icon+span{margin-left:6px}\n.ui-icon{width:var(--fui-icon);height:var(--fui-icon);flex-shrink:0;vertical-align:middle;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}\n.ui-icon.filled{fill:currentColor;stroke:none}.chevron{width:20px;height:20px;transform:rotate(-90deg);transition:transform .15s}.chevron.expanded{transform:rotate(0)}\n.card-top{display:flex;align-items:stretch;border-bottom:1px solid var(--divider-color,#e0e0e0);min-height:52px}\nnav{display:flex;flex:1;min-width:0;overflow-x:auto;scrollbar-width:none;padding:0 8px}nav::-webkit-scrollbar{display:none}\nnav button{flex-shrink:0;border-radius:0;border-bottom:2px solid transparent;color:var(--secondary-text-color,#727272);padding:16px 14px;white-space:nowrap;font-size:14px}\nnav button.selected{border-bottom-color:var(--primary-color,#03a9f4);color:var(--primary-color,#03a9f4)}\n.icon-tab{display:grid;place-items:center;width:48px;padding:10px!important}.icon-tab .ui-icon{width:24px;height:24px}\n.settings-button{width:48px;flex-shrink:0;display:grid;place-items:center;padding:12px;border-radius:0;color:var(--secondary-text-color,#727272)}\n.settings-button.selected{color:var(--primary-color,#03a9f4);background:color-mix(in srgb,var(--primary-color,#03a9f4) 8%,transparent)}.settings-button svg{width:24px;height:24px}\nmain{padding:8px 16px 16px}.toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap}\n.page-actions{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:4px 0}.page-actions button{font-size:13px}\n.program-add{font-size:13px}\n.program-order{display:flex;gap:0}.program-order button{width:30px;height:34px;padding:4px;color:var(--primary-color,#03a9f4);font-size:18px;line-height:1}\n.filter-button{margin-right:auto;border:1px solid var(--divider-color,#e0e0e0);padding:6px 12px;align-self:center}\n.filter-button[aria-pressed=\"true\"]{background:var(--primary-color,#03a9f4);color:var(--text-primary-color,#fff);border-color:var(--primary-color,#03a9f4)}\n.edit-button{display:inline-flex;align-items:center;justify-content:center;min-width:var(--fui-touch);min-height:var(--fui-touch);padding:8px}.edit-button .ui-icon{width:20px;height:20px}\n.settings-group{padding:var(--fui-section-padding) 0;border-bottom:1px solid var(--divider-color,#e0e0e0)}.settings-group:last-child{border-bottom:0}\n.settings-heading-row{display:flex;align-items:center;justify-content:space-between;gap:16px}.settings-heading-row .settings-fold{flex:1;min-width:0}.settings-heading-row>button{flex-shrink:0;font-size:13px}\n.settings-fold{display:flex;align-items:center;gap:6px;width:100%;padding:0;color:var(--primary-text-color,#212121);text-align:left}.settings-fold span{font-size:14px;font-weight:500;overflow-wrap:anywhere}\n.setting-row{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:var(--fui-touch);padding:var(--fui-row-padding) 0;border-bottom:1px solid var(--divider-color,#e0e0e0)}.setting-row:last-child{border-bottom:0}\n.row-text{flex:1;min-width:0;overflow-wrap:anywhere}.row-text strong{font-size:13px;font-weight:500;line-height:1.35}.row-text small{display:block}.setting-row>.toolbar{gap:0;flex-shrink:0}\n.toggle{display:inline-flex;align-items:center;gap:9px;padding:6px 0;color:var(--primary-text-color,#212121);font-size:12px;font-weight:400;white-space:nowrap;min-height:40px}.toggle:hover{background:transparent}\n.switch-track{display:inline-flex;align-items:center;width:36px;height:20px;border-radius:12px;background:var(--switch-unchecked-track-color,#9e9e9e);padding:2px;flex-shrink:0}.switch-thumb{display:block;width:16px;height:16px;border-radius:50%;background:var(--switch-unchecked-button-color,#fff);box-shadow:0 1px 3px #0003;transition:transform .15s}\n.toggle.on .switch-track{background:color-mix(in srgb,var(--primary-color,#03a9f4) 50%,transparent)}.toggle.on .switch-thumb{transform:translateX(16px);background:var(--primary-color,#03a9f4)}\n.setting-row .toggle>span:last-child,.toggle.icon-only>span:last-child{display:none}\n.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.full{grid-column:1/-1}.field{display:flex;flex-direction:column;gap:6px;min-width:0;font-size:12px}.field>span{color:var(--secondary-text-color,#727272)}\ninput:not([type=checkbox]):not([type=range]),select,textarea{width:100%;min-width:0;border:1px solid var(--divider-color,#bdbdbd);border-radius:4px;padding:11px 10px;color:var(--primary-text-color,#212121);background:var(--input-fill-color,var(--secondary-background-color,#f5f5f5))}\ninput[type=checkbox]{width:18px;height:18px;accent-color:var(--primary-color,#03a9f4)}\n.modal{padding:0;width:800px;max-width:calc(100% - 48px);max-height:90vh;border:0;background:var(--ha-card-background,var(--card-background-color,#fff));color:var(--primary-text-color,#212121);border-radius:var(--ha-dialog-border-radius,12px);box-shadow:0 8px 32px #0004}\n.modal[open]{display:flex;flex-direction:column}.modal::backdrop{background:#0006}\n.modal-head,footer{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 24px;flex-shrink:0}.modal-head{border-bottom:1px solid var(--divider-color,#e0e0e0)}.modal-head h3{font-size:20px;font-weight:400;overflow-wrap:anywhere}.modal-head button{color:var(--secondary-text-color,#727272)}.modal-body{padding:20px 24px;overflow-y:auto}footer{border-top:1px solid var(--divider-color,#e0e0e0);justify-content:flex-end;flex-wrap:wrap}\n.notice,.error{padding:12px 16px;font-size:13px}.notice{color:var(--secondary-text-color,#727272)}.error{color:var(--error-color,#db4437);background:color-mix(in srgb,var(--error-color,#db4437) 8%,transparent)}\n.version-info{font-size:12px;color:var(--secondary-text-color,#727272);margin-top:16px;overflow-wrap:anywhere}\n[hidden]{display:none!important}\n@media(max-width:600px){.card-top{min-height:48px}nav{padding:0 4px}nav button{padding:14px 8px;font-size:13px}.settings-button{width:42px;padding:9px}main{padding:4px 12px 12px}.settings-heading-row{gap:8px}.desktop-only{display:none!important}.modal{max-width:calc(100% - 16px);max-height:96vh;max-height:96dvh}.modal-head,footer{padding:12px 16px}.modal-head h3{font-size:18px}.modal-body{padding:16px}.grid{grid-template-columns:minmax(0,1fr)}.full{grid-column:auto}}\n@media(prefers-reduced-motion:reduce){.chevron,.switch-thumb{transition:none}}\n\n/* Geometry follows the source priority documented in COMPONENTS.md. */\n.fui-account-tiles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}\n.fui-account-tile{aspect-ratio:1/1;min-width:0;min-height:0;position:relative;display:block;padding:16px;border:1px solid var(--divider-color,#e0e0e0);border-radius:var(--ha-card-border-radius,12px);background:var(--ha-card-background,var(--card-background-color,#fff));overflow:hidden}\n.fui-account-label{font-size:13px;font-weight:500;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:left}\n.fui-account-balance{position:absolute;inset:0;padding:16px;min-width:0;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:var(--primary-text-color,#212121);pointer-events:none}\n.fui-account-value{max-width:100%;font-size:clamp(28px,7vw,48px);font-weight:500;line-height:1.1;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}\n.fui-account-unit{font-size:12px;line-height:1.5}\n.fui-account-description{position:absolute;left:16px;right:16px;bottom:16px;font-size:11px;line-height:1.35;color:var(--secondary-text-color,#727272);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.fui-account-tile.active .fui-account-balance{color:var(--primary-color,#03a9f4)}.fui-account-tile.success .fui-account-balance{color:var(--success-color,#2e7d32)}.fui-account-tile.warning .fui-account-balance{color:var(--warning-color,#f9a825)}.fui-account-tile.error .fui-account-balance{color:var(--error-color,#db4437)}\n@media(max-width:600px){.fui-account-tiles{gap:12px}.fui-account-tile,.fui-account-balance{padding:12px}.fui-account-description{left:12px;right:12px;bottom:12px}}\nfieldset{border:0;padding:0;margin:0;min-width:0}legend,.field-label{font-size:12px;color:var(--secondary-text-color,#727272);margin-bottom:6px}\n.field-error,.modal-save-error{color:var(--error-color,#db4437);font-size:13px;line-height:1.5}.fui-presets{margin-top:8px}.field-unit{align-self:flex-end}\n.check{display:flex;align-items:center;gap:8px;font-size:13px;min-height:32px}.check input{margin:0;flex-shrink:0}.fui-checks{display:flex;gap:8px 16px;flex-wrap:wrap}.fui-check-group{margin:8px 0}\n.fui-check-group .days{display:flex;flex-wrap:wrap;gap:6px}.fui-check-group .days label{position:relative;cursor:pointer}.fui-check-group .days input{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer}.fui-check-group .days span{pointer-events:none;display:block;padding:8px 11px;border:1px solid var(--divider-color,#e0e0e0);border-radius:16px;font-size:12px}.fui-check-group .days input:checked+span{color:var(--primary-color,#03a9f4);background:color-mix(in srgb,var(--primary-color,#03a9f4) 12%,transparent);border-color:transparent}.fui-check-group .days input:focus-visible+span{outline:2px solid var(--primary-color,#03a9f4)}.fui-check-group .days input:disabled+span{opacity:.45}\n.fui-combobox{position:relative}.fui-combobox .field input{padding-right:48px}.fui-combo-toggle{position:absolute;right:1px;top:22px}.fui-options{border:1px solid var(--divider-color,#bdbdbd);border-radius:4px;margin-top:4px;max-height:336px;overflow-y:auto;overscroll-behavior:contain}.fui-option{display:flex;flex-direction:column;align-items:flex-start;text-align:left;width:100%;height:56px;padding:8px 10px;border-radius:0;border-bottom:1px solid var(--divider-color,#e0e0e0)}.fui-option:last-of-type{border-bottom:0}.fui-option strong,.fui-option small{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.fui-option.active,.fui-option[aria-selected=true]{background:color-mix(in srgb,var(--primary-color,#03a9f4) 8%,transparent)}.fui-options-empty{padding:12px;font-size:13px}\n.import-toolbar{margin:12px 0}.fui-multi>label{margin-top:12px}.fui-selection-list{margin-top:8px;max-height:400px;overflow-y:auto}.fui-selection-group h4{font-size:14px;font-weight:500;margin:12px 0 6px}.cover-option{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--divider-color,#e0e0e0);cursor:pointer}.cover-option>span{min-width:0;display:flex;flex-direction:column;gap:4px;overflow-wrap:anywhere}.cover-option strong{font-size:14px;font-weight:500}.cover-option:has(input:disabled){opacity:.6;cursor:default}\n.position-control{min-width:0;padding:6px 0}.slider-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:6px;font-size:13px}.slider-head label{color:var(--secondary-text-color,#727272)}.slider-head output{font-size:14px;font-weight:500;font-variant-numeric:tabular-nums}.position-control input[type=range]{appearance:none;-webkit-appearance:none;width:100%;display:block;height:4px;border:0;padding:0;margin:16px 0;border-radius:2px;cursor:pointer;accent-color:var(--primary-color,#03a9f4);background:linear-gradient(to right,var(--primary-color,#03a9f4) 0,var(--primary-color,#03a9f4) var(--range-percent),var(--divider-color,#ddd) var(--range-percent),var(--divider-color,#ddd) 100%)}.position-control input[type=range]::-webkit-slider-thumb{appearance:none;width:16px;height:16px;border-radius:50%;background:var(--primary-color,#03a9f4)}.position-control input[type=range]::-moz-range-thumb{width:16px;height:16px;border:0;border-radius:50%;background:var(--primary-color,#03a9f4)}.slider-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;color:var(--secondary-text-color,#727272);font-size:11px}.keep-value{font-size:11px;padding:4px 8px}.keep-value.selected{background:color-mix(in srgb,var(--primary-color,#03a9f4) 12%,transparent)}.position-control input:disabled{opacity:.45;cursor:default}\n.white-labels{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px}.white-control input[type=range]{background:linear-gradient(90deg,#d7e8ff,#fff6d7,#ffc77a)}\n.colour-control{display:flex;flex-direction:column;gap:10px}.colour-wheel{width:min(100%,340px);aspect-ratio:1;border-radius:50%;position:relative;touch-action:none;cursor:crosshair;background:radial-gradient(circle closest-side,#fff 0%,#ffffff00 100%),conic-gradient(#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00);flex-shrink:0}.colour-wheel:focus-visible{outline:2px solid var(--primary-color,#03a9f4);outline-offset:4px}.colour-wheel[aria-disabled=true]{opacity:.45;cursor:default}.colour-marker{position:absolute;width:18px;height:18px;border:2px solid white;box-shadow:0 0 0 1px #0009;border-radius:50%;transform:translate(-50%,-50%);pointer-events:none}.colour-preview{display:flex;align-items:center;gap:8px;font-size:13px}.colour-preview>span{width:26px;height:26px;border:1px solid var(--divider-color,#ddd);border-radius:4px}\n.season-box{padding:8px 0}.season-dates{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;max-width:360px;margin:10px 0}.recurrence-controls{display:grid;gap:16px;margin-top:12px}.repeat-line{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.repeat-line input{max-width:80px}.repeat-line select{max-width:120px}\n.program-group{border-bottom:1px solid var(--divider-color,#e0e0e0)}.program-group-head{display:flex;width:100%;align-items:center;gap:8px;padding:12px 0;color:var(--primary-text-color,#212121);text-align:left;border-radius:4px}.program-group-head strong{font-size:16px;font-weight:500}.program-group-head>span:last-child{margin-left:auto;color:var(--secondary-text-color,#727272);font-size:12px}.program{padding:10px 0;border-bottom:1px solid var(--divider-color,#e0e0e0)}.program-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.program-heading{flex:1;min-width:0}.program-title{display:flex;align-items:center;gap:8px;padding:0;color:var(--primary-text-color,#212121);font-size:15px;text-align:left}.program-title span{overflow-wrap:anywhere}.program-title>.ui-icon+span{margin-left:0}.tags{display:flex;flex-wrap:wrap;gap:4px 10px;margin:6px 0 0 28px}.tags span{font-size:12px;color:var(--secondary-text-color,#727272)}.muted>.program-head,.muted>.ride-info{opacity:.55}.ride{display:flex;justify-content:space-between;gap:16px;padding:8px 0;margin-left:28px;border-top:1px solid var(--divider-color,#e0e0e0)}.ride-info{display:flex;flex-direction:column;gap:3px;min-width:0;overflow-wrap:anywhere}.ride-info strong{font-size:14px;font-weight:500}.ride-info>span{font-size:13px}.ride-actions{align-self:center}.subpanel{border:1px solid var(--divider-color,#e0e0e0);border-radius:8px;padding:16px;margin:12px 0}.ride-editor-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.ride-fold{display:flex;align-items:center;gap:8px;flex:1;min-width:0;padding:4px 0;text-align:left;color:var(--primary-text-color,#212121);border-radius:4px}.ride-fold-text{display:flex;flex-direction:column;gap:5px;min-width:0;overflow-wrap:anywhere}.ride-fold-text strong{font-size:14px;font-weight:500}.ride-fold-text>span{font-size:12px;line-height:1.5;color:var(--secondary-text-color,#727272)}.ride-editor-body{margin-top:16px;padding-top:16px;border-top:1px solid var(--divider-color,#e0e0e0)}\n.overview-panel{border-bottom:1px solid var(--divider-color,#e0e0e0)}.overview-toggle{display:flex;align-items:center;gap:6px;padding:10px 16px;color:var(--secondary-text-color,#727272);font-size:12px;border-radius:0}.overview{padding:0 16px 14px}.sun-row{display:flex;align-items:center;gap:28px;padding:4px 0 12px}.sun-value{display:inline-flex;align-items:center;gap:8px;font-size:14px;font-variant-numeric:tabular-nums}.sun-value .ui-icon{color:var(--primary-color,#03a9f4)}.overview-group+.overview-group{margin-top:14px}.overview-group h4{font-size:11px;font-weight:500;color:var(--secondary-text-color,#727272);margin:0 0 8px}.sensor-grid{display:flex;flex-wrap:wrap;align-items:center;gap:9px 24px}.sensor-value{display:inline-flex;max-width:100%;align-items:center;gap:8px;min-width:0;font-size:13px;line-height:1.5}.sensor-label{min-width:0;overflow-wrap:anywhere}.sensor-state{display:inline-flex;align-items:center;gap:6px;flex-shrink:0;font-variant-numeric:tabular-nums}.sensor-state .ui-icon{width:18px;height:18px;color:var(--secondary-text-color,#727272)}\n.daily-history-row{display:grid;grid-template-columns:42px minmax(0,1fr) auto;align-items:start;gap:10px;padding:10px 0;border-bottom:1px solid var(--divider-color,#e0e0e0);font-size:12px}.daily-history-row:last-child{border-bottom:0}.daily-history-row time{font-variant-numeric:tabular-nums}.daily-command{display:flex;flex-direction:column;gap:3px;min-width:0;overflow-wrap:anywhere}.daily-command strong{font-weight:500;font-size:13px}.daily-command small{font-size:12px}.command-result{display:flex;align-items:center;gap:4px;white-space:nowrap;font-size:11px}.command-result .ui-icon{width:16px;height:16px}.completed .command-result{color:var(--success-color,#2e7d32)}.failed .command-result{color:var(--error-color,#db4437)}.pending .command-result{color:var(--secondary-text-color,#727272)}.failure-reason{overflow-wrap:anywhere}.fui-history-month{margin-left:8px}\n.fui-status-tag{display:inline-flex;align-items:center;gap:4px;font-size:12px;color:var(--secondary-text-color,#727272);margin-right:10px}.fui-status-tag.active{color:var(--primary-color,#03a9f4)}.fui-status-tag.success{color:var(--success-color,#2e7d32)}.fui-status-tag.error{color:var(--error-color,#db4437)}.fui-status-tag.warning{color:var(--warning-color,#f9a825)}.fui-status-tag .ui-icon{width:16px;height:16px}.fui-counter{font-size:12px;color:var(--secondary-text-color,#727272);white-space:nowrap}\n.fui-statistics{overflow-x:auto}.fui-statistics table{width:100%;border-collapse:collapse;font-size:13px}.fui-statistics th,.fui-statistics td{padding:var(--fui-row-padding) 0;border-bottom:1px solid var(--divider-color,#e0e0e0);text-align:left;overflow-wrap:anywhere}.fui-statistics .numeric{text-align:right}.fui-statistics tfoot{font-weight:500}\n.week{display:flex;align-items:center;gap:8px;margin:8px 0}.week strong{flex:1;min-width:0;text-align:center;font-size:14px}.calendar-row{display:grid;grid-template-columns:44px minmax(0,1fr);gap:8px;align-items:center;border-bottom:1px solid var(--divider-color,#e0e0e0);padding:4px 0}.day-date{display:grid;text-align:center}.calendar-content{min-width:0}.calendar-content .setting-row{border:0}.meal-link{display:inline-block;color:var(--primary-color,#03a9f4);margin-bottom:4px}.calendar-row.empty{line-height:inherit}.calendar-row.empty .row-text strong{color:var(--secondary-text-color,#727272)}.fui-calendar.fui-check-group .days{display:block}.checks{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end}.assignee{font-size:12px;color:var(--secondary-text-color,#727272)}.complete{display:grid;place-items:center;min-width:40px;min-height:40px;cursor:pointer}.completed .row-text strong,.assignee.completed{text-decoration:line-through;color:var(--secondary-text-color,#727272)}\n.language-picker{display:flex;gap:8px}.language-picker button{min-width:70px;border:1px solid var(--divider-color,#e0e0e0);color:var(--primary-text-color,#212121);border-radius:var(--ha-button-border-radius,20px)}.language-picker button[aria-pressed=true]{border-color:var(--primary-color,#03a9f4);background:color-mix(in srgb,var(--primary-color,#03a9f4) 12%,transparent);color:var(--primary-color,#03a9f4)}.language-picker button span{font-size:12px;font-weight:600}.backup-actions{margin-top:12px}\n.howto{line-height:1.6;font-size:14px;padding:12px 0}.howto h2{font-size:20px;font-weight:400;margin:0 0 14px}.howto h3{font-size:16px;margin:24px 0 10px}.howto p{margin:10px 0}.howto ul,.howto ol{padding-left:22px;margin:10px 0}.howto li{margin:8px 0}.howto table{width:100%;border-collapse:collapse;font-size:13px}.howto th,.howto td{padding:10px 8px;border-bottom:1px solid var(--divider-color,#e0e0e0);text-align:left;vertical-align:top}\n.fui-panel-header{min-height:64px;background:var(--ha-card-background,var(--card-background-color,#fff));border-bottom:1px solid var(--divider-color,#e0e0e0);display:flex;align-items:center;padding:0 24px;gap:12px;position:sticky;top:0;z-index:5;flex-wrap:wrap}.fui-panel-header strong{font-size:20px;font-weight:500}.fui-panel-header .grow{flex:1}\n.fui-feedback{padding:12px 16px;font-size:13px;line-height:1.5;overflow-wrap:anywhere}.fui-feedback.info{color:var(--secondary-text-color,#727272)}.fui-feedback.error{color:var(--error-color,#db4437);background:color-mix(in srgb,var(--error-color,#db4437) 8%,transparent)}.fui-feedback.warning{color:var(--primary-text-color,#212121);border-left:4px solid var(--warning-color,#f9a825);background:color-mix(in srgb,var(--warning-color,#f9a825) 8%,transparent)}.fui-feedback.success{color:var(--success-color,#2e7d32)}.empty:not(.calendar-row){padding:24px 0;color:var(--secondary-text-color,#727272);line-height:1.6}.modal-save-error{margin:0 0 4px}.gm-photo-box{display:grid;gap:8px}.photo-preview{display:block;max-width:100%;max-height:300px;object-fit:contain;margin:auto}.gm-photo-large{display:block;width:100%;max-height:70dvh;object-fit:contain}\n.visually-hidden{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}\n@media(max-width:600px){.fui-check-group .days{gap:5px}.fui-check-group .days span{padding:8px 10px}.program-head{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:4px 8px}.program-heading{display:contents}.program-title{grid-column:1;grid-row:1;min-width:0}.program-head>.toolbar{grid-column:2;grid-row:1;justify-self:end;gap:4px;flex-wrap:nowrap}.program-head .tags{grid-column:1/-1;grid-row:2;margin-top:0}.ride{gap:10px}.ride-editor-head{align-items:flex-start;flex-wrap:wrap;gap:8px}.ride-fold{flex-basis:100%}.ride-editor-actions{margin-left:28px;justify-content:flex-end;flex:1}.subpanel{padding:12px}.ride-editor-body{margin-top:12px;padding-top:12px}.fui-panel-header{padding:8px 12px;gap:8px}.fui-panel-header strong{font-size:17px}.fui-panel-header>button{font-size:12px;padding:9px}.week{gap:4px}.week strong{font-size:13px}}\n@media(max-width:380px){.daily-history-row{gap:6px;grid-template-columns:36px minmax(0,1fr) auto}.command-result{font-size:10px}}\n";
// Source paths: Shutter Manager 1.4.0. See docs/PROVENANCE.json.
const ICON_PATHS = Object.freeze({
  "sunrise": "<path d=\"M2 17h20M5 21h14M7 17a5 5 0 0 1 10 0M4 12l-2-2m18 2 2-2M12 9V2m-3 3 3-3 3 3\"/>",
  "sunset": "<path d=\"M2 17h20M5 21h14M7 17a5 5 0 0 1 10 0M4 12l-2-2m18 2 2-2M12 2v7m-3-3 3 3 3-3\"/>",
  "lock": "<rect x=\"5\" y=\"10\" width=\"14\" height=\"11\" rx=\"2\"/><path d=\"M8 10V6a4 4 0 0 1 8 0v4m-4 5v2\"/>",
  "unlock": "<rect x=\"5\" y=\"10\" width=\"14\" height=\"11\" rx=\"2\"/><path d=\"M8 10V6a4 4 0 0 1 7.5-2M12 15v2\"/>",
  "temperature": "<path d=\"M9 14.5V5a3 3 0 0 1 6 0v9.5a5 5 0 1 1-6 0M12 8v10\"/><circle cx=\"12\" cy=\"18\" r=\"1\"/>",
  "illuminance": "<circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5\"/>",
  "schedule": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 6v6l4 2\"/>",
  "sensors": "<circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M6.3 6.3a8 8 0 0 0 0 11.4m11.4-11.4a8 8 0 0 1 0 11.4M3.5 3.5a12 12 0 0 0 0 17m17-17a12 12 0 0 1 0 17\"/>",
  "success": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"m7 12 3 3 7-7\"/>",
  "failure": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 7v6m0 4h.01\"/>",
  "trash": "<path d=\"M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6m4-6v6\"/>",
  "move": "<path d=\"M14 4H4v16h10M10 12h12m-4-4 4 4-4 4\"/>",
  "copy": "<rect x=\"8\" y=\"8\" width=\"13\" height=\"13\" rx=\"2\"/><path d=\"M16 8V3H3v13h5\"/>",
  "edit": "<path d=\"M4 16l12-12 4 4L8 20H4v-4M14 6l4 4\"/>",
  "unknown": "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M10 8a2 2 0 1 1 3 2c-1 .5-1 1-1 2m0 4h.01\"/>",
  "settings": "<path d=\"M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.63l-1.92-3.32a.49.49 0 0 0-.6-.22l-2.39.96a7.1 7.1 0 0 0-1.62-.94l-.36-2.54a.49.49 0 0 0-.49-.42h-3.84a.49.49 0 0 0-.49.42l-.36 2.54c-.59.24-1.13.56-1.62.94l-2.39-.96a.49.49 0 0 0-.6.22L2.68 8.85a.49.49 0 0 0 .12.63l2.03 1.58a7.3 7.3 0 0 0 0 1.88L2.8 14.52a.49.49 0 0 0-.12.63l1.92 3.32c.12.22.38.31.6.22l2.39-.96c.49.38 1.03.7 1.62.94l.36 2.54c.04.24.24.42.49.42h3.84c.25 0 .45-.18.49-.42l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.09.48 0 .6-.22l1.92-3.32a.49.49 0 0 0-.12-.63zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z\"/>",
  "help": "<path d=\"M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm-1-3h2v-2h-2v2zm1-11a4 4 0 0 0-4 4h2a2 2 0 1 1 4 0c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5a4 4 0 0 0-4-4z\"/>",
  "chevron": "<path d=\"M4 6l4 4 4-4\"/>",
  "add": "<path d=\"M12 5v14M5 12h14\"/>",
  "close": "<path d=\"m6 6 12 12M6 18 18 6\"/>",
  "save": "<path d=\"M5 3h12l4 4v14H3V3h2M7 3v6h10V3M7 21v-8h10v8\"/>",
  "up": "<path d=\"m5 15 7-7 7 7\"/>",
  "left": "<g transform=\"rotate(-90 12 12)\"><path d=\"m5 15 7-7 7 7\"/></g>",
  "right": "<g transform=\"rotate(90 12 12)\"><path d=\"m5 15 7-7 7 7\"/></g>",
  "menu": "<path d=\"M4 6h16M4 12h16M4 18h16\"/>",
  "down": "<path d=\"m5 9 7 7 7-7\"/>"
});
const ICON_NAMES = Object.freeze(Object.keys(ICON_PATHS));
function icon(name, {expanded = false} = {}) {
  if (!Object.hasOwn(ICON_PATHS, name)) throw new TypeError(`Unknown icon: ${name}`);
  const filled = name === 'settings' || name === 'help';
  const chevron = name === 'chevron';
  return `<svg class="ui-icon${filled ? ' filled' : ''}${chevron ? ' chevron' : ''}${chevron && expanded ? ' expanded' : ''}" data-icon="${name}" viewBox="0 0 ${chevron ? '16 16' : '24 24'}" aria-hidden="true" focusable="false">${ICON_PATHS[name]}</svg>`;
}


/** Text/attribute escaping; content parameters explicitly accept trusted application markup. */
function escapeHtml(value = '') {
  return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function dataAttrs(data = {}) {
  return Object.entries(data).map(([key, value]) => {
    if (!/^[a-z][a-z0-9-]*$/.test(key)) throw new TypeError(`Invalid data attribute: ${key}`);
    return ` data-${key}="${escapeHtml(value)}"`;
  }).join('');
}

function actionAttrs(action, data) {
  if (Object.hasOwn(data || {}, 'action')) throw new TypeError('Use the action argument for data-action');
  return ` data-action="${escapeHtml(action)}"${dataAttrs(data)}`;
}

function button({label, action, icon: name, variant = 'text', disabled = false, data = {}}) {
  if (!['text', 'primary', 'danger'].includes(variant)) throw new TypeError('Unknown button variant');
  return `<button type="button" class="${variant === 'text' ? '' : variant}"${actionAttrs(action, data)}${disabled ? ' disabled' : ''}>${name ? icon(name) : ''}<span>${escapeHtml(label)}</span></button>`;
}

/** Shutter Manager's text plus is intentional: do not substitute the generic add SVG. */
function programAddButton({label = 'Programm', action = 'new-program', disabled = false, data = {}} = {}) {
  return `<button type="button" class="primary program-add"${actionAttrs(action, data)}${disabled ? ' disabled' : ''}>+ ${escapeHtml(label)}</button>`;
}

/** Controlled ordering: index/count refer to the sortable group, not the whole list. */
function programOrderButtons({programId, index, count, action = 'move-program', disabled = false, desktopOnly = true, upLabel = 'Nach oben sortieren', downLabel = 'Nach unten sortieren'}) {
  if (typeof programId !== 'string' || !programId) throw new TypeError('Ordering requires a program ID');
  if (!Number.isInteger(index) || !Number.isInteger(count) || count < 1 || index < 0 || index >= count) throw new RangeError('Ordering requires 0 <= index < count');
  const control = (direction, label, glyph, atBoundary) => `<button type="button"${actionAttrs(action, {program:programId, direction})} title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}"${disabled || atBoundary ? ' disabled' : ''}>${glyph}</button>`;
  return `<div class="program-order${desktopOnly ? ' desktop-only' : ''}">${control('up', upLabel, '↑', index === 0)}${control('down', downLabel, '↓', index === count - 1)}</div>`;
}

function iconButton({icon: name, label, action, disabled = false, danger = false, data = {}, desktopOnly = false}) {
  if (!label) throw new TypeError('Icon buttons require a label');
  return `<button type="button" class="edit-button${danger ? ' danger' : ''}${desktopOnly ? ' desktop-only' : ''}"${actionAttrs(action, data)} aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}"${disabled ? ' disabled' : ''}>${icon(name)}</button>`;
}

function navigation({label, items, active, settings = true, help = true, settingsLabel = 'Einstellungen', helpLabel = 'Anleitung'}) {
  const navButton = (item, cls = '') => `<button type="button" class="${cls}${item.id === active ? ' selected' : ''}"${actionAttrs('navigate', {page:item.id})} aria-current="${item.id === active ? 'page' : 'false'}"${item.icon ? ` aria-label="${escapeHtml(item.label)}" title="${escapeHtml(item.label)}"` : ''}>${item.icon ? icon(item.icon) : escapeHtml(item.label)}</button>`;
  return `<div class="card-top"><nav aria-label="${escapeHtml(label)}">${items.map(item => navButton(item, item.icon ? 'icon-tab' : '')).join('')}</nav>${help ? navButton({id:'help', label:helpLabel, icon:'help'}, 'settings-button') : ''}${settings ? navButton({id:'settings', label:settingsLabel, icon:'settings'}, 'settings-button') : ''}</div>`;
}

function toggle({label, action, checked = false, disabled = false, data = {}, iconOnly = false}) {
  return `<button type="button" class="toggle${checked ? ' on' : ''}${iconOnly ? ' icon-only' : ''}" role="switch" aria-checked="${Boolean(checked)}" aria-label="${escapeHtml(label)}"${actionAttrs(action, data)}${disabled ? ' disabled' : ''}><span class="switch-track" aria-hidden="true"><span class="switch-thumb"></span></span><span>${escapeHtml(label)}</span></button>`;
}

function filterButton({label, action, selected = false, data = {}}) {
  return `<button type="button" class="filter-button"${actionAttrs(action, data)} aria-pressed="${Boolean(selected)}">${escapeHtml(label)}</button>`;
}

/** id must be unique within the card's ShadowRoot. trailing/content are trusted markup. */
function section({id, title, content = '', trailing = '', expanded = true}) {
  if (!id || /\s/.test(id)) throw new TypeError('Section requires a nonempty ID without whitespace');
  return `<section class="settings-group" data-settings="${escapeHtml(id)}"><div class="settings-heading-row"><button type="button" class="settings-fold" data-ui="collapse" aria-expanded="${Boolean(expanded)}" aria-controls="${escapeHtml(id)}-content">${icon('chevron', {expanded})}<span>${escapeHtml(title)}</span></button>${trailing}</div><div id="${escapeHtml(id)}-content"${expanded ? '' : ' hidden'}>${content}</div></section>`;
}

function row({title, description = '', trailing = ''}) {
  return `<div class="setting-row"><div class="row-text"><strong>${escapeHtml(title)}</strong>${description ? `<small>${escapeHtml(description)}</small>` : ''}</div><div class="toolbar">${trailing}</div></div>`;
}

function field({id, label, value = '', type = 'text', required = false, disabled = false, name, min, max, step, placeholder, maxLength, inputMode, autocomplete, unit = '', hint = '', error = ''}) {
  if (!['text','number','time','date','email','search','url'].includes(type)) throw new TypeError('Unsupported field type');
  const attrs = Object.entries({name,min,max,step,placeholder,maxlength:maxLength,inputmode:inputMode,autocomplete}).filter(([,v])=>v!==undefined).map(([k,v])=>` ${k}="${escapeHtml(v)}"`).join('');
  const described = [hint && id+'-hint',error && id+'-error'].filter(Boolean).join(' ');
  return `<label class="field" for="${escapeHtml(id)}"><span>${escapeHtml(label)}</span><input id="${escapeHtml(id)}" type="${type}" value="${escapeHtml(value)}"${attrs}${required ? ' required' : ''}${disabled ? ' disabled' : ''}${error ? ' aria-invalid="true"' : ''}${described ? ` aria-describedby="${escapeHtml(described)}"` : ''}>${unit?`<small class="field-unit">${escapeHtml(unit)}</small>`:''}${hint?`<small id="${escapeHtml(id)}-hint">${escapeHtml(hint)}</small>`:''}${error?`<small class="field-error" id="${escapeHtml(id)}-error" role="alert">${escapeHtml(error)}</small>`:''}</label>`;
}

function selectField({id, label, value = '', options, disabled = false, name, required = false, hint = '', error = ''}) {
  const render = option => option.options ? `<optgroup label="${escapeHtml(option.label)}">${option.options.map(render).join('')}</optgroup>` : `<option value="${escapeHtml(option.value)}"${String(option.value) === String(value) ? ' selected' : ''}${option.disabled?' disabled':''}>${escapeHtml(option.label)}</option>`;
  return `<label class="field" for="${escapeHtml(id)}"><span>${escapeHtml(label)}</span><select id="${escapeHtml(id)}"${name?` name="${escapeHtml(name)}"`:''}${disabled ? ' disabled' : ''}${required?' required':''}${error?' aria-invalid="true"':''}${hint||error?` aria-describedby="${escapeHtml(id)}-help"`:''}>${options.map(render).join('')}</select>${hint||error?`<small id="${escapeHtml(id)}-help" class="${error?'field-error':''}"${error?' role="alert"':''}>${escapeHtml(error||hint)}</small>`:''}</label>`;
}

/** A native modal: call showModal() after inserting it. Escape and focus stay native. */
function dialog({id, title, content, actions = '', closeLabel = 'Schließen'}) {
  return `<dialog id="${escapeHtml(id)}" class="modal" aria-labelledby="${escapeHtml(id)}-title"><div class="modal-head"><h3 id="${escapeHtml(id)}-title">${escapeHtml(title)}</h3><button type="button" class="edit-button" data-ui="close-dialog" aria-label="${escapeHtml(closeLabel)}" title="${escapeHtml(closeLabel)}">${icon('close')}</button></div><div class="modal-body">${content}</div><footer>${actions}</footer></dialog>`;
}

function notice(message, {error = false} = {}) {
  return `<div class="${error ? 'error' : 'notice'}" role="${error ? 'alert' : 'status'}">${escapeHtml(message)}</div>`;
}

function versionInfo({frontend, backend, ui, label = 'Oberfläche', backendLabel = 'Integration'}) {
  return `<p class="version-info">${escapeHtml(label)} ${escapeHtml(frontend)}${backend ? ` · ${escapeHtml(backendLabel)} ${escapeHtml(backend)}` : ''}${ui ? ` · UI ${escapeHtml(ui)}` : ''}</p>`;
}

/** Bind once per ShadowRoot; the returned function removes the listener on disconnect. */
function bindUI(root, onAction = () => {}) {
  const unbindObjects = bindObjects(root, onAction);
  const handleClick = event => {
    const target = event.target.closest?.('button');
    if (!target || !root.contains(target) || target.disabled) return;
    if (target.dataset.ui === 'collapse') {
      const content = root.getElementById(target.getAttribute('aria-controls'));
      if (!content) return;
      const expanded = target.getAttribute('aria-expanded') !== 'true';
      target.setAttribute('aria-expanded', String(expanded));
      content.hidden = !expanded;
      target.querySelector('.chevron')?.classList.toggle('expanded', expanded);
      return;
    }
    if (target.dataset.ui === 'close-dialog') {
      target.closest('dialog')?.close();
      return;
    }
    if (!target.hasAttribute('data-action')) return;
    // Controlled components: the integration decides whether to commit the change.
    const checked = target.getAttribute('role') === 'switch' ? target.getAttribute('aria-checked') !== 'true' : undefined;
    onAction({action:target.dataset.action, data:{...target.dataset}, checked, element:target, originalEvent:event});
  };
  root.addEventListener('click', handleClick);
  const handleKeydown = event => {
    if (event.key !== 'Tab') return;
    const modal = event.target.closest?.('dialog[open]');
    if (!modal) return;
    const controls = [...modal.querySelectorAll('button,input,select,textarea,a[href],[tabindex]')].filter(el => !el.disabled && el.tabIndex >= 0 && el.getClientRects().length);
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && event.target === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && event.target === last) { event.preventDefault(); first?.focus(); }
  };
  root.addEventListener('keydown', handleKeydown);
  return () => { unbindObjects(); root.removeEventListener('click', handleClick); root.removeEventListener('keydown', handleKeydown); };
}


// Content/actions/body/cell-renderers accept trusted application markup, all data text is escaped.
function objectId(id) { if (typeof id !== 'string' || !id || /\s/.test(id)) throw new TypeError('A unique ID without whitespace is required'); return escapeHtml(id); }
function objectAction(action) { return `data-control-action="${escapeHtml(action)}"`; }

function textareaField({id,label,value='',name,rows=3,maxLength,required=false,disabled=false,hint='',error=''}) {
  objectId(id);
  return `<label class="field" for="${escapeHtml(id)}"><span>${escapeHtml(label)}</span><textarea id="${escapeHtml(id)}" rows="${Math.max(1,Number(rows)||3)}"${name?` name="${escapeHtml(name)}"`:''}${maxLength!==undefined?` maxlength="${escapeHtml(maxLength)}"`:''}${required?' required':''}${disabled?' disabled':''}${error?' aria-invalid="true"':''}${hint||error?` aria-describedby="${escapeHtml(id)}-help"`:''}>${escapeHtml(value)}</textarea>${hint||error?`<small id="${escapeHtml(id)}-help" class="${error?'field-error':''}"${error?' role="alert"':''}>${escapeHtml(error||hint)}</small>`:''}</label>`;
}

function numberControl({id,label,value='',presets=[],action='number-change',...options}) {
  objectId(id);
  return `<div class="fui-number" ${objectAction(action)}>${field({id,label,value,type:'number',...options})}${presets.length?`<div class="toolbar fui-presets" role="group" aria-label="${escapeHtml(label)} – Schnellwerte">${presets.map(p=>`<button type="button" data-ui-preset="${escapeHtml(typeof p==='object'?p.value:p)}"${options.disabled?' disabled':''}>${escapeHtml(typeof p==='object'?p.label:p)}</button>`).join('')}</div>`:''}</div>`;
}

function checkboxGroup({id,label,items,values=[],action='selection-change',disabled=false,days=false}) {
  objectId(id);const selected=new Set(values.map(String));
  return `<fieldset class="fui-check-group" id="${escapeHtml(id)}" data-ui-checks ${objectAction(action)}><legend>${escapeHtml(label)}</legend><div class="${days?'days':'fui-checks'}">${items.map((item,i)=>`<label class="${days?'':'check'}"${item.description?` title="${escapeHtml(item.description)}"`:''}><input type="checkbox" value="${escapeHtml(item.value??item.id)}" aria-label="${escapeHtml(item.description||item.label)}"${selected.has(String(item.value??item.id))?' checked':''}${disabled||item.disabled?' disabled':''}><span>${escapeHtml(item.label)}</span></label>`).join('')}</div></fieldset>`;
}

function weekdayPicker({id,label='Wochentage',values=[],action='weekdays-change',disabled=false,labels=['Mo','Di','Mi','Do','Fr','Sa','So']}={}) {
  return checkboxGroup({id,label,values,action,disabled,days:true,items:labels.map((label,value)=>({value,label}))}).replace('data-ui-checks','data-ui-checks data-value-type="number"');
}

function combobox({id,label,items,value='',selected='',action='combobox-select',placeholder='Suchen …',required=false,disabled=false,emptyLabel='Keine passenden Einträge gefunden.'}) {
  objectId(id);
  return `<div class="fui-combobox" id="${escapeHtml(id)}-control" data-ui-combobox data-selected="${escapeHtml(selected)}" ${objectAction(action)}>${field({id,label,value,placeholder,required,disabled,autocomplete:'off'}).replace('<input ',`<input role="combobox" aria-autocomplete="list" aria-controls="${escapeHtml(id)}-options" aria-expanded="false" `)}<button type="button" class="edit-button fui-combo-toggle" data-ui-combo-toggle aria-label="${escapeHtml(label)} aufklappen"${disabled?' disabled':''}>${icon('down')}</button><div class="fui-options" id="${escapeHtml(id)}-options" role="listbox" aria-label="${escapeHtml(label)}" hidden>${items.map((item,i)=>`<button type="button" class="fui-option" role="option" tabindex="-1" id="${escapeHtml(id)}-option-${i}" data-ui-option data-value="${escapeHtml(item.value??item.id)}" data-label="${escapeHtml(item.label)}" aria-selected="${String(String(item.value??item.id)===String(selected))}"${item.disabled?' disabled':''}><strong>${escapeHtml(item.label)}</strong>${item.description?`<small>${escapeHtml(item.description)}</small>`:''}</button>`).join('')}<div class="fui-options-empty" role="status" hidden>${escapeHtml(emptyLabel)}</div></div></div>`;
}

function multiSelect({id,label='Auswahl',items,values=[],action='selection-change',search=true,all=true,selectedFirst=false,disabled=false,searchLabel='Name oder Entität suchen',allLabel='Alle sichtbaren auswählen',clearLabel='Auswahl aufheben',emptyLabel='Keine Treffer für diese Auswahl.'}) {
  objectId(id);const selected=new Set(values.map(String)),groups=[...new Set(items.map(i=>i.group||''))];
  return `<fieldset class="fui-multi" id="${escapeHtml(id)}" data-ui-multi ${objectAction(action)} data-selected-first="${selectedFirst}"><legend>${escapeHtml(label)}</legend>${search?field({id:id+'-search',label:searchLabel,type:'search',disabled}):''}${all?`<div class="toolbar import-toolbar"><button type="button" data-ui-select-all${disabled?' disabled':''}>${escapeHtml(allLabel)}</button><button type="button" data-ui-select-none${disabled?' disabled':''}>${escapeHtml(clearLabel)}</button></div>`:''}<div class="fui-selection-list">${groups.map(group=>`<section class="fui-selection-group" data-selection-group>${group?`<h4>${escapeHtml(group)}</h4>`:''}${items.filter(i=>(i.group||'')===group).sort((a,b)=>selectedFirst?Number(selected.has(String(b.value??b.id)))-Number(selected.has(String(a.value??a.id))):0).map(item=>`<label class="cover-option" data-selection-row data-search="${escapeHtml([item.label,item.description,item.value??item.id].filter(Boolean).join(' ').toLocaleLowerCase())}"><input type="checkbox" value="${escapeHtml(item.value??item.id)}"${selected.has(String(item.value??item.id))?' checked':''}${disabled||item.disabled?' disabled':''}><span><strong>${escapeHtml(item.label)}</strong>${item.description?`<small>${escapeHtml(item.description)}</small>`:''}${item.hint?`<small>${escapeHtml(item.hint)}</small>`:''}</span></label>`).join('')}</section>`).join('')}</div><p class="hint fui-selection-empty" role="status"${items.length?' hidden':''}>${escapeHtml(emptyLabel)}</p><small data-selection-count aria-live="polite">${items.filter(i=>selected.has(String(i.value??i.id))).length} ausgewählt</small></fieldset>`;
}

function rangeControl({id,label,value=0,min=0,max=100,step=1,unit='%',action='range-change',keepLabel='Unverändert',allowKeep=true,disabled=false,reverse=false}) {
  objectId(id);if(!Number.isFinite(min)||!Number.isFinite(max)||max<=min||!Number.isFinite(step)||step<=0)throw new RangeError('Invalid range');
  const keep=value===null,n=keep?min:Math.max(min,Math.min(max,Number(value)));if(!Number.isFinite(n))throw new TypeError('Invalid range value');
  const position=reverse?max-n+min:n,percent=(position-min)/(max-min)*100;
  return `<div class="position-control" data-ui-range id="${escapeHtml(id)}-control" ${objectAction(action)} data-unit="${escapeHtml(unit)}" data-keep="${keep}" data-keep-label="${escapeHtml(keepLabel)}" data-reverse="${reverse}"><div class="slider-head"><label for="${escapeHtml(id)}">${escapeHtml(label)}</label><output for="${escapeHtml(id)}">${escapeHtml(keep?keepLabel:n+(unit?' '+unit:''))}</output></div><input id="${escapeHtml(id)}" type="range" min="${min}" max="${max}" step="${step}" value="${position}" aria-label="${escapeHtml(label)}" aria-valuetext="${escapeHtml(keep?keepLabel:n+(unit?' '+unit:''))}" style="--range-percent:${percent}%"${disabled?' disabled':''}>${allowKeep?`<div class="slider-foot"><button type="button" class="keep-value${keep?' selected':''}" data-ui-keep aria-pressed="${keep}"${disabled?' disabled':''}>${escapeHtml(keepLabel)}</button></div>`:''}</div>`;
}

function whiteTemperatureControl({id,label='Weißtöne',value=4000,min=2000,max=6500,action='temperature-change',disabled=false,coldLabel='Kaltweiß',warmLabel='Warmweiß'}) {
  return `<div class="white-control"><div class="white-labels"><span>${escapeHtml(coldLabel)}</span><span>${escapeHtml(warmLabel)}</span></div>${rangeControl({id,label,value,min,max,step:1,unit:'K',action,allowKeep:false,disabled,reverse:true})}<div class="white-labels hint"><span>${max} K</span><span>${min} K</span></div></div>`;
}

function parseColour(value) {
  if(Array.isArray(value)&&value.length===3&&value.every(n=>Number.isFinite(n)&&n>=0&&n<=255))return value.map(Math.round);
  if(typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value))return [1,3,5].map(i=>parseInt(value.slice(i,i+2),16));
  throw new TypeError('Colour requires #RRGGBB or three RGB numbers');
}
function rgbToHSV(rgb) { const [r,g,b]=parseColour(rgb).map(n=>n/255),max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;let h=0;if(d)h=max===r?((g-b)/d)%6:max===g?(b-r)/d+2:(r-g)/d+4;return {h:(h*60+360)%360,s:max?d/max:0,v:max}; }
function hsvToRGB(h,s,v=1) { if(![h,s,v].every(Number.isFinite)||s<0||s>1||v<0||v>1)throw new RangeError('Invalid HSV colour');h=((h%360)+360)%360;const c=v*s,x=c*(1-Math.abs((h/60)%2-1)),m=v-c;return (h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x]).map(n=>Math.round((n+m)*255)); }
function colourPicker({id,label='Farbe',value='#FF7000',action='colour-change',disabled=false}) {
  objectId(id);const rgb=parseColour(value),{h,s}=rgbToHSV(rgb),a=h*Math.PI/180,hex='#'+rgb.map(n=>n.toString(16).padStart(2,'0')).join('');
  return `<div class="colour-control" id="${escapeHtml(id)}" data-ui-colour ${objectAction(action)} data-rgb="${rgb.join(',')}"><span class="field-label">${escapeHtml(label)}</span><div class="colour-wheel" tabindex="${disabled?-1:0}" role="group" aria-label="${escapeHtml(label)}: Pfeiltasten zum Wählen, Pos1 für Weiß" aria-disabled="${disabled}" aria-describedby="${escapeHtml(id)}-value"><span class="colour-marker" style="left:${50+Math.sin(a)*s*50}%;top:${50-Math.cos(a)*s*50}%;background:${hex}"></span></div><div class="colour-preview"><span data-colour-swatch style="background:${hex}"></span><output id="${escapeHtml(id)}-value" aria-live="polite">${hex.toUpperCase()}</output></div></div>`;
}

function timeWindow({id,label='Zeitfenster',start='00:00',end='00:00',action='time-window-change',disabled=false,startLabel='Von',endLabel='Bis'}) {
  objectId(id);return `<fieldset class="fui-time-window" id="${escapeHtml(id)}" data-ui-time-window ${objectAction(action)}><legend>${escapeHtml(label)}</legend><div class="grid">${field({id:id+'-start',name:'start',label:startLabel,value:start,type:'time',required:true,disabled})}${field({id:id+'-end',name:'end',label:endLabel,value:end,type:'time',required:true,disabled})}</div><small>Gleiche Uhrzeit = ganztägig. Zeitfenster über Mitternacht sind möglich.</small></fieldset>`;
}
function parseMonthDay(value) {
  const m=String(value).match(/^(\d{1,2})\.(\d{1,2})\.?$/);if(!m)return null;
  const day=Number(m[1]),month=Number(m[2]),date=new Date(Date.UTC(2000,month-1,day));
  return date.getUTCMonth()===month-1&&date.getUTCDate()===day?`${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`:null;
}
function seasonPicker({id,label='Gültigkeitszeitraum',enabled=false,start='04-01',end='10-31',action='season-change',disabled=false}) {
  objectId(id);const display=s=>/^\d{2}-\d{2}$/.test(s)?s.slice(3)+'.'+s.slice(0,2):s;
  return `<fieldset class="season-box" id="${escapeHtml(id)}" data-ui-season ${objectAction(action)}><legend>${escapeHtml(label)}</legend><label class="check"><input type="checkbox" data-season-enabled${enabled?' checked':''}${disabled?' disabled':''}>Saison einschränken</label><div class="season-dates"${enabled?'':' hidden'}>${field({id:id+'-start',name:'start',label:'Von (TT.MM.)',value:display(start),placeholder:'01.04.',maxLength:6,inputMode:'numeric',disabled:disabled||!enabled})}${field({id:id+'-end',name:'end',label:'Bis (TT.MM.)',value:display(end),placeholder:'31.10.',maxLength:6,inputMode:'numeric',disabled:disabled||!enabled})}</div><small>Der Zeitraum darf über den Jahreswechsel reichen.</small></fieldset>`;
}

function dateRange({id,label='Zeitraum',start='',end='',action='date-range-change',disabled=false,optionalEnd=true}) {
  objectId(id);return `<fieldset id="${escapeHtml(id)}" data-ui-date-range ${objectAction(action)}><legend>${escapeHtml(label)}</legend><div class="grid">${field({id:id+'-start',name:'start',label:'Von',value:start,type:'date',required:true,disabled})}${field({id:id+'-end',name:'end',label:optionalEnd?'Bis (optional)':'Bis',value:end,type:'date',min:start||undefined,required:!optionalEnd,disabled})}</div></fieldset>`;
}

function recurrenceEditor({id,label='Wiederholung',value={},action='recurrence-change',disabled=false,people=[]}) {
  objectId(id);const kind=value.kind||'once',unit=kind==='daily'?'day':kind==='yearly'?'year':kind.startsWith('monthly')?'month':'week',start=value.start||'',days=value.weekdays||[],repeating=kind!=='once';
  return `<fieldset class="recurrence"${disabled?' disabled':''} id="${escapeHtml(id)}" data-ui-recurrence ${objectAction(action)}><legend>${escapeHtml(label)}</legend>${dateRange({id:id+'-dates',start,end:value.end||'',disabled})}<label class="check"><input type="checkbox" name="repeating"${repeating?' checked':''}${disabled?' disabled':''}>${icon('schedule')}Wiederkehrend</label><div class="recurrence-controls"${repeating?'':' hidden'}><div class="repeat-line"><span>Wiederholen alle</span><input type="number" name="interval" min="1" max="365" value="${escapeHtml(value.interval??1)}" aria-label="Wiederholungsabstand"${disabled||!repeating?' disabled':''}><select name="unit" aria-label="Wiederholungseinheit"${disabled||!repeating?' disabled':''}>${[['day','Tag'],['week','Woche'],['month','Monat'],['year','Jahr']].map(([v,l])=>`<option value="${v}"${unit===v?' selected':''}>${l}</option>`).join('')}</select></div><label class="field" data-month-mode><span>Monatliches Muster</span><select name="month_mode"${disabled?' disabled':''}><option value="date"${kind!=='monthly_nth'?' selected':''}>Am Tag des Startdatums</option><option value="nth"${kind==='monthly_nth'?' selected':''}>An einem bestimmten Wochentag</option></select></label><label class="field" data-nth><span>Welcher im Monat?</span><select name="nth"${disabled?' disabled':''}>${[[1,'Erster'],[2,'Zweiter'],[3,'Dritter'],[4,'Vierter'],[5,'Fünfter'],[-1,'Letzter']].map(([v,l])=>`<option value="${v}"${Number(value.nth??1)===v?' selected':''}>${l}</option>`).join('')}</select></label>${weekdayPicker({id:id+'-days',values:days,disabled})}${people.length?`<label class="check"><input type="checkbox" name="alternating"${value.alternating?' checked':''}${disabled?' disabled':''}>Abwechselnd</label><label class="field" data-first-person><span>Wer beginnt?</span><select name="first_person"${disabled?' disabled':''}>${people.map(p=>`<option value="${escapeHtml(p)}"${value.first_person===p?' selected':''}>${escapeHtml(p)}</option>`).join('')}</select></label>`:''}<small class="recurrence-hint" aria-live="polite"></small></div></fieldset>`;
}

function programGroup({id,title,count,content='',expanded=true}) {
  objectId(id);return `<section class="program-group" id="${escapeHtml(id)}"><button type="button" class="program-group-head" data-ui="collapse" aria-expanded="${expanded}" aria-controls="${escapeHtml(id)}-content">${icon('chevron',{expanded})}<strong>${escapeHtml(title)}</strong><span>${escapeHtml(count??'')}</span></button><div id="${escapeHtml(id)}-content"${expanded?'':' hidden'}>${content}</div></section>`;
}
function programRow({id,title,meta=[],enabled=true,expanded=false,content='',actions='',index=0,count=1,editable=true,sortable=true,copyable=true,disabled=false}) {
  objectId(id);const data={program:id};
  const tools=(editable&&sortable?programOrderButtons({programId:id,index,count,disabled}):'')+toggle({label:title+' aktiv',action:'program-enabled',checked:enabled,disabled,data,iconOnly:true})+(editable&&copyable?iconButton({icon:'copy',label:'Programm kopieren',action:'copy-program',data,disabled,desktopOnly:true}):'')+(editable?iconButton({icon:'edit',label:'Programm bearbeiten',action:'edit-program',data,disabled}):'')+actions;
  return `<section class="program${enabled?'':' muted'}"><div class="program-head"><div class="program-heading"><button type="button" class="program-title" data-ui="collapse" aria-expanded="${expanded}" aria-controls="${escapeHtml(id)}-content">${icon('chevron',{expanded})}<span>${escapeHtml(title)}</span></button><div class="tags">${meta.map(t=>`<span>${escapeHtml(t)}</span>`).join('')}</div></div><div class="toolbar">${tools}</div></div><div id="${escapeHtml(id)}-content"${expanded?'':' hidden'}>${content}</div></section>`;
}
function actionRow({title,description='',detail='',actions='',enabled=true}) {
  return `<div class="ride${enabled?'':' muted'}"><div class="ride-info"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(description)}</span>${detail?`<small>${escapeHtml(detail)}</small>`:''}</div><div class="toolbar ride-actions">${actions}</div></div>`;
}
function actionEditor({id,title,summary='',content='',actions='',expanded=true}) {
  objectId(id);return `<section class="subpanel"><div class="ride-editor-head"><button type="button" class="ride-fold" data-ui="collapse" aria-controls="${escapeHtml(id)}-body" aria-expanded="${expanded}">${icon('chevron',{expanded})}<span class="ride-fold-text"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(summary)}</span></span></button><div class="toolbar ride-editor-actions">${actions}</div></div><div id="${escapeHtml(id)}-body" class="ride-editor-body"${expanded?'':' hidden'}>${content}</div></section>`;
}
function foldControls({scopeId,expandLabel='Alle aufklappen',collapseLabel='Alle zuklappen'}) {
  objectId(scopeId);return `<div class="toolbar"><button type="button" data-ui-fold-all="true" data-scope="${escapeHtml(scopeId)}">${escapeHtml(expandLabel)}</button><button type="button" data-ui-fold-all="false" data-scope="${escapeHtml(scopeId)}">${escapeHtml(collapseLabel)}</button></div>`;
}
function sensorOverview({id,title='Messwerte',expanded=true,sunrise='',sunset='',groups=[]}) {
  objectId(id);return `<div class="overview-panel"><button type="button" class="overview-toggle" data-ui="collapse" aria-controls="${escapeHtml(id)}-content" aria-expanded="${expanded}">${icon('chevron',{expanded})}<span>${escapeHtml(title)}</span></button><section class="overview" id="${escapeHtml(id)}-content"${expanded?'':' hidden'}>${sunrise||sunset?`<div class="sun-row">${[['sunrise',sunrise,'Sonnenaufgang'],['sunset',sunset,'Sonnenuntergang']].filter(([,v])=>v).map(([name,value,label])=>`<span class="sun-value" title="${label}" aria-label="${label} ${escapeHtml(value)}">${icon(name)}<span>${escapeHtml(value)}</span></span>`).join('')}</div>`:''}${groups.map(group=>`<section class="overview-group"><h4>${escapeHtml(group.title)}</h4><div class="sensor-grid">${group.items.map(item=>`<div class="sensor-value"><span class="sensor-label">${escapeHtml(item.label)}</span><span class="sensor-state" title="${escapeHtml(item.value)}">${icon(item.icon||'unknown')}<span${item.icon==='lock'||item.icon==='unlock'?' class="visually-hidden"':''}>${escapeHtml(item.value)}</span></span></div>`).join('')}</div></section>`).join('')}</section></div>`;
}
function statusBadge({label,state='neutral',icon:iconName}) {
  if(!['neutral','active','success','warning','error','paused'].includes(state))throw new TypeError('Unknown status state');
  return `<span class="fui-status-tag ${state}">${iconName?icon(iconName):''}${escapeHtml(label)}</span>`;
}
function counter(value,label='') { return `<small class="fui-counter"${label?` aria-label="${escapeHtml(label)}"`:''}>${escapeHtml(value)}</small>`; }
/** Static account summary. Values, units, status and permissions belong to the host. */
function accountTile({id,label,value,unit='',status='',state='neutral',description='',details=''}) {
  objectId(id);
  if(!['neutral','active','success','warning','error'].includes(state))throw new TypeError('Unknown account state');
  return `<article class="fui-account-tile ${state}" id="${escapeHtml(id)}" aria-labelledby="${escapeHtml(id)}-label"${details?` aria-describedby="${escapeHtml(id)}-details" title="${escapeHtml(details)}"`:''}><h4 class="fui-account-label" id="${escapeHtml(id)}-label" title="${escapeHtml(label)}">${escapeHtml(label)}</h4><div class="fui-account-balance"><strong class="fui-account-value">${escapeHtml(value)}</strong><span class="fui-account-unit">${escapeHtml([unit,status].filter(Boolean).join(' '))}</span></div>${description?`<p class="fui-account-description" title="${escapeHtml(description)}">${escapeHtml(description)}</p>`:''}${details?`<span class="visually-hidden" id="${escapeHtml(id)}-details">${escapeHtml(details)}</span>`:''}</article>`;
}
/** Always two equal columns, including mobile and single-account views. */
function accountTiles({content,label='Zeitkonten'}) {
  return `<div class="fui-account-tiles" role="group" aria-label="${escapeHtml(label)}">${content}</div>`;
}
function historyList({entries,emptyLabel='Noch keine Einträge vorhanden.'}) {
  if(!entries.length)return emptyState(emptyLabel);
  return `<div class="daily-history" role="list">${entries.map(entry=>{
    const failed=entry.status==='error',pending=entry.status==='pending',result=entry.result||(failed?'Fehlgeschlagen':pending?'Wartet':'Erfolgreich');
    return `<div class="daily-history-row ${failed?'failed':pending?'pending':'completed'}" role="listitem"><time${entry.datetime?` datetime="${escapeHtml(entry.datetime)}"`:''}>${escapeHtml(entry.time)}</time><div class="daily-command"><strong>${escapeHtml(entry.title)}</strong><small>${escapeHtml(entry.description)}</small>${entry.detail?`<small class="failure-reason">${escapeHtml(entry.detail)}</small>`:''}</div><span class="command-result">${icon(failed?'failure':pending?'schedule':'success')}${escapeHtml(result)}</span></div>`;
  }).join('')}</div>`;
}
function groupedHistory({id,title='Verlauf',groups,expanded=false}) {
  objectId(id);return section({id,title,expanded,trailing:counter(groups.reduce((n,g)=>n+g.entries.length,0),'Einträge'),content:groups.map((g,i)=>`<div class="fui-history-month">${section({id:id+'-group-'+i,title:g.title,expanded:g.expanded??false,trailing:counter(g.entries.length),content:historyList({entries:g.entries})})}</div>`).join('')||emptyState('Noch keine Einträge vorhanden.')});
}
function statisticsTable({label='Statistik',columns,rows,totals}) {
  if(!columns.length)throw new TypeError('Statistics needs columns');
  const cells=(values,tag)=>columns.map((col,i)=>`<${tag}${tag==='th'?' scope="col"':''}${col.align==='right'?' class="numeric"':''}>${escapeHtml(values[i])}</${tag}>`).join('');
  return `<div class="fui-statistics"><table aria-label="${escapeHtml(label)}"><thead><tr>${cells(columns.map(c=>c.label),'th')}</tr></thead><tbody>${rows.map(values=>`<tr>${cells(values,'td')}</tr>`).join('')}</tbody>${totals?`<tfoot><tr>${cells(totals,'td')}</tr></tfoot>`:''}</table></div>`;
}
function dateNavigation({label,previousLabel='Vorherige Woche',nextLabel='Nächste Woche',todayLabel='Heute',previousAction='previous-period',nextAction='next-period',todayAction='today',disabled=false}) {
  return `<div class="week">${iconButton({icon:'left',label:previousLabel,action:previousAction,disabled})}<strong>${escapeHtml(label)}</strong>${button({label:todayLabel,action:todayAction,disabled})}${iconButton({icon:'right',label:nextLabel,action:nextAction,disabled})}</div>`;
}
function dateKey(date) {return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
function calendarDates(start,count=7) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||!Number.isInteger(count)||count<1||count>366)throw new TypeError('Invalid calendar range');
  const first=new Date(start+'T12:00:00');if(!Number.isFinite(first.getTime())||dateKey(first)!==start)throw new TypeError('Invalid calendar date');
  return Array.from({length:count},(_,i)=>{const day=new Date(first);day.setDate(day.getDate()+i);return dateKey(day);});
}
function safeLink(value) {try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)?escapeHtml(u.href):'';}catch{return '';}}
function weekCalendar({id,start,entries=[],locale='de-DE',today='',emptyLabel='Eintrag hinzufügen',action='open-day'}) {
  objectId(id);return `<div id="${escapeHtml(id)}" class="days fui-calendar">${calendarDates(start).map(date=>{const entry=entries.find(e=>e.date===date),day=new Date(date+'T12:00:00'),link=entry?.link&&safeLink(entry.link);return `<article class="calendar-row${entry?'':' empty'}${date===today?' today':''}" data-ui-calendar-day="${date}" ${objectAction(action)}><div class="day-date"><b>${escapeHtml(day.toLocaleDateString(locale,{weekday:'short'}))}</b><small>${escapeHtml(day.toLocaleDateString(locale,{day:'2-digit',month:'2-digit'}))}</small></div><div class="calendar-content"><div class="setting-row"><div class="row-text"><strong>${escapeHtml(entry?.title||emptyLabel)}</strong>${entry?.description?`<small>${escapeHtml(entry.description)}</small>`:''}</div><div class="toolbar">${entry?.actions||iconButton({icon:entry?'edit':'add',label:entry?'Eintrag bearbeiten':emptyLabel,action,data:{date}})}</div></div>${link?`<a class="meal-link" href="${link}" target="_blank" rel="noopener">Link öffnen</a>`:''}</div></article>`;}).join('')}</div>`;
}
function completionRow({id,title,description='',people=[],action='completion-change',readOnly=false}) {
  objectId(id);const completed=people.length&&people.every(p=>p.completed);
  return `<div class="setting-row${completed?' completed':''}"><div class="row-text"><strong>${escapeHtml(title)}</strong><small>${escapeHtml(description)}</small></div><div class="checks">${people.map(p=>readOnly?`<span class="assignee${p.completed?' completed':''}">${escapeHtml(p.label)}${p.completed?icon('success'):''}</span>`:`<label class="complete" ${objectAction(action)} data-ui-completion data-id="${escapeHtml(id)}" data-person="${escapeHtml(p.id)}"><input type="checkbox" aria-label="${escapeHtml(title+' – '+p.label)}"${p.completed?' checked':''}${p.disabled?' disabled':''}><span class="visually-hidden">${escapeHtml(p.label)}</span></label>`).join('')}</div></div>`;
}
function dayAgenda({id,days}) {objectId(id);return days.map((day,i)=>section({id:id+'-'+i,title:day.title,expanded:day.expanded??true,trailing:counter(day.count??'',day.countLabel||''),content:day.content||''})).join('');}
function languagePicker({value='de',action='language-change',languages=[{id:'de',label:'Deutsch',short:'DE',flag:'🇩🇪'},{id:'en',label:'English',short:'EN',flag:'🇬🇧'}] }={}) {
  return `<div class="language-picker" role="group" aria-label="Sprache">${languages.map(l=>`<button type="button" data-action="${escapeHtml(action)}" data-language="${escapeHtml(l.id)}" aria-pressed="${l.id===value}" title="${escapeHtml(l.label)}">${escapeHtml(l.flag||'')} <span>${escapeHtml(l.short||l.id)}</span></button>`).join('')}</div>`;
}
function backupControls({id='backup',exportAction='export-backup',importAction='import-backup',exportLabel='Sicherung erstellen',importLabel='Sicherung wiederherstellen',disabled=false,maxBytes=2*1024*1024}={}) {
  objectId(id);return `<div id="${escapeHtml(id)}" data-ui-backup ${objectAction(importAction)} data-max-bytes="${Number(maxBytes)}"><div class="toolbar backup-actions">${button({label:exportLabel,action:exportAction,disabled})}<button type="button" data-ui-import${disabled?' disabled':''}>${escapeHtml(importLabel)}</button></div><input type="file" accept="application/json,.json" aria-label="Sicherungsdatei" hidden${disabled?' disabled':''}><div data-backup-feedback></div></div>`;
}
function helpContent({title='',content=''}) {return `<article class="howto">${title?`<h2>${escapeHtml(title)}</h2>`:''}${content}</article>`;}
function panelHeader({title,dirty=false,busy=false,menu=true,reload=true,save=true,menuAction='menu',reloadAction='reload',saveAction='save',saveLabel='Änderungen speichern',savedLabel='Gespeichert'}) {
  return `<header class="fui-panel-header">${menu?iconButton({icon:'menu',label:'Menü öffnen',action:menuAction}):''}<strong>${escapeHtml(title)}</strong><span class="grow"></span>${reload?button({label:'Neu laden',action:reloadAction,disabled:busy}):''}${save?busyButton({label:dirty?saveLabel:savedLabel,busy,disabled:!dirty,action:saveAction}):''}</header>`;
}
function feedback(message,{kind='info'}={}) {
  if(!['info','success','warning','error'].includes(kind))throw new TypeError('Unknown feedback kind');
  return `<div class="fui-feedback ${kind}" role="${kind==='error'?'alert':'status'}">${escapeHtml(message)}</div>`;
}
function formError(message) {return `<p class="modal-save-error" role="alert"${message?'':' hidden'}>${escapeHtml(message)}</p>`;}
function emptyState(message,{actionContent=''}={}) {return `<div class="empty" role="status">${escapeHtml(message)}${actionContent?`<div class="toolbar">${actionContent}</div>`:''}</div>`;}
function loadingState(label='Wird geladen …') {return `<p class="hint fui-loading" role="status" aria-live="polite" aria-busy="true">${escapeHtml(label)}</p>`;}
function busyButton({label='Speichern',busy=false,busyLabel='Speichern …',disabled=false,action='save',variant='primary',data={}}={}) {return button({label:busy?busyLabel:label,disabled:disabled||busy,action,variant,data}).replace('<button ',`<button aria-busy="${busy}" `);}
function confirmDialog({id,title='Eintrag löschen?',message,confirmLabel='Löschen',cancelLabel='Abbrechen',confirmAction='confirm',cancelAction='cancel',danger=true}) {
  return dialog({id,title,content:`<p>${escapeHtml(message)}</p>`,actions:button({label:cancelLabel,action:cancelAction}).replace('data-action=', 'data-ui-cancel-action=')+button({label:confirmLabel,action:confirmAction,variant:danger?'danger':'primary'})});
}
function photoPreview({src,alt='Foto',large=false}) {
  if(!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(src||''))throw new TypeError('A JPEG/PNG/WebP data URL is required');
  return `<img class="${large?'gm-photo-large':'photo-preview'}" src="${escapeHtml(src)}" alt="${escapeHtml(alt)}">`;
}
function photoPicker({id,label='Foto (optional)',src='',action='photo-change',disabled=false}) {
  objectId(id);return `<div class="gm-photo-box" id="${escapeHtml(id)}" data-ui-photo ${objectAction(action)}><span class="field-label">${escapeHtml(label)}</span><div class="toolbar"><button type="button" data-ui-photo-choose${disabled?' disabled':''}>Foto wählen</button><button type="button" data-ui-photo-remove${src?'':' hidden'}${disabled?' disabled':''}>Foto entfernen</button></div><input type="file" accept="image/jpeg,image/png,image/webp" hidden aria-label="${escapeHtml(label)}"${disabled?' disabled':''}><div data-photo-preview>${src?photoPreview({src}):''}</div><small data-photo-status role="status">${src?'Foto vorhanden.':'JPG / PNG / WebP · bis 20 MB · wird automatisch verkleinert.'}</small><div data-photo-error></div></div>`;
}
function photoDialog({id,title='Foto',src,alt}) {return dialog({id,title,content:photoPreview({src,alt,large:true})});}


function recurrenceSummary(rule) {
  if(rule.kind==='once')return 'Einmalig';
  const n=rule.interval||1,days=['Mo','Di','Mi','Do','Fr','Sa','So'];
  if(rule.kind==='daily')return n===1?'Täglich':`Alle ${n} Tage`;
  if(rule.kind==='weekly')return (n===1?'Jede Woche':`Alle ${n} Wochen`)+' · '+(rule.weekdays||[]).map(i=>days[i]).join(', ');
  if(rule.kind==='yearly')return (n===1?'Jährlich':`Alle ${n} Jahre`)+' · '+(rule.start||'').slice(5);
  const prefix=n===1?'Monatlich':`Alle ${n} Monate`;
  return rule.kind==='monthly_date'?prefix+' · am '+Number((rule.start||'').slice(8))+'. Tag':prefix+' · '+(rule.nth===-1?'Letzter':rule.nth+'.')+' '+(rule.weekdays||[]).map(i=>days[i]).join(', ');
}

async function readJSONFile(file,{maxBytes=2*1024*1024}={}) {
  if(!file||typeof file.text!=='function')throw new TypeError('Bitte eine Sicherungsdatei auswählen.');
  if(file.size>maxBytes)throw new Error('Datei zu groß.');
  try{return JSON.parse(await file.text());}catch{throw new Error('Die Datei enthält kein gültiges JSON.');}
}
function downloadJSON(value,{filename='sicherung.json',document:doc=globalThis.document}={}) {
  const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'})),a=doc.createElement('a');
  a.href=url;a.download=filename;doc.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),0);
}
async function compressPhoto(file) {
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Bitte ein JPG-, PNG- oder WebP-Foto wählen.');
  if(file.size>20*1024*1024)throw new Error('Bitte ein Foto bis 20 MB wählen.');
  const url=URL.createObjectURL(file);
  try{
    const img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error('Das Foto konnte nicht gelesen werden.'));img.src=url;});
    if(!img.naturalWidth||!img.naturalHeight)throw new Error('Das Foto hat keine gültige Größe.');
    const factor=Math.min(1,1600/Math.max(img.naturalWidth,img.naturalHeight)),canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(img.naturalWidth*factor));canvas.height=Math.max(1,Math.round(img.naturalHeight*factor));
    const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Bildverarbeitung nicht verfügbar.');
    ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
    for(const quality of [.85,.7,.55,.4]){const data=canvas.toDataURL('image/jpeg',quality);if(data.length<950000)return data;}
    throw new Error('Das Foto ist zu groß. Bitte ein kleineres Bild wählen.');
  }finally{URL.revokeObjectURL(url);}
}

/** UI event delegation only: no network, HA services, persistence or business decisions. */
function bindObjects(root,onAction) {
  let disposed=false;const initialized=new WeakSet(),photoTokens=new WeakMap();
  const emit=(control,event,value,extra={})=>{if(!disposed&&control.dataset.controlAction)onAction({action:control.dataset.controlAction,data:{...control.dataset},value,element:control,originalEvent:event,...extra});};
  const closeCombo=box=>{box.querySelector('[role=listbox]').hidden=true;const input=box.querySelector('input');input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');box.querySelectorAll('.active').forEach(el=>el.classList.remove('active'));};
  const options=box=>[...box.querySelectorAll('[data-ui-option]')].filter(el=>!el.hidden&&!el.disabled);
  const filterCombo=box=>{
    const input=box.querySelector('input'),q=input.value.trim().toLocaleLowerCase();
    box.querySelectorAll('[data-ui-option]').forEach(el=>{el.hidden=!el.textContent.toLocaleLowerCase().includes(q);el.classList.remove('active');});
    box.querySelector('.fui-options-empty').hidden=Boolean(options(box).length);
    input.removeAttribute('aria-activedescendant');
  };
  const openCombo=box=>{if(box.querySelector('input').disabled)return;filterCombo(box);box.querySelector('[role=listbox]').hidden=false;box.querySelector('input').setAttribute('aria-expanded','true');};
  const choose=(box,option,event)=>{
    if(option.disabled)return;const input=box.querySelector('input');input.value=option.dataset.label;box.dataset.selected=option.dataset.value;
    box.querySelectorAll('[data-ui-option]').forEach(el=>el.setAttribute('aria-selected',String(el===option)));
    input.focus();closeCombo(box);emit(box,event,option.dataset.value,{label:option.dataset.label});
  };
  const updateMulti=control=>{
    const q=(control.querySelector('input[type=search]')?.value||'').trim().toLocaleLowerCase();
    for(const group of control.querySelectorAll('[data-selection-group]')){
      let rows=[...group.querySelectorAll('[data-selection-row]')];
      rows.forEach(el=>el.hidden=!el.dataset.search.includes(q));
      if(control.dataset.selectedFirst==='true'){rows.sort((a,b)=>Number(b.querySelector('input').checked)-Number(a.querySelector('input').checked));rows.forEach(el=>group.append(el));}
      group.hidden=rows.every(el=>el.hidden);
    }
    control.querySelector('.fui-selection-empty').hidden=Boolean(control.querySelector('[data-selection-row]:not([hidden])'));
    control.querySelector('[data-selection-count]').textContent=control.querySelectorAll('input[type=checkbox]:checked').length+' ausgewählt';
  };
  const selection=control=>[...control.querySelectorAll('input[type=checkbox]:checked')].map(el=>control.dataset.valueType==='number'?Number(el.value):el.value);
  const updateRange=control=>{
    const input=control.querySelector('input'),keep=control.dataset.keep==='true',n=control.dataset.reverse==='true'?Number(input.max)+Number(input.min)-Number(input.value):Number(input.value),text=keep?control.dataset.keepLabel:n+(control.dataset.unit?' '+control.dataset.unit:'');
    control.querySelector('output').textContent=text;input.setAttribute('aria-valuetext',text);input.style.setProperty('--range-percent',((input.value-input.min)/(input.max-input.min)*100)+'%');
    const button=control.querySelector('[data-ui-keep]');button?.classList.toggle('selected',keep);button?.setAttribute('aria-pressed',String(keep));return keep?null:n;
  };
  const updateRecurrence=control=>{
    const get=name=>control.querySelector(`[name="${name}"]`),repeating=get('repeating'),alternate=get('alternating'),globalDisabled=control.hasAttribute('disabled');
    if(alternate?.checked)repeating.checked=true;
    const unit=get('unit').value,kind=!repeating.checked?'once':unit==='day'?'daily':unit==='year'?'yearly':unit==='month'?(get('month_mode').value==='nth'?'monthly_nth':'monthly_date'):'weekly';
    const start=get('start').value,end=get('end');end.min=start;end.closest('label').hidden=!repeating.checked;end.disabled=globalDisabled||!repeating.checked;
    control.querySelector('.recurrence-controls').hidden=!repeating.checked;
    control.querySelector('[data-month-mode]').hidden=unit!=='month';control.querySelector('[data-nth]').hidden=kind!=='monthly_nth';
    const days=control.querySelector('[data-ui-checks]');days.hidden=!['weekly','monthly_nth'].includes(kind);
    const first=control.querySelector('[data-first-person]');if(first)first.hidden=!alternate?.checked;
    control.querySelectorAll('.recurrence-controls input,.recurrence-controls select').forEach(el=>{el.disabled=globalDisabled||!repeating.checked||Boolean(el.closest('[hidden]'));});
    const rule={kind,interval:kind==='once'?1:Number(get('interval').value),start,end:kind==='once'?'':end.value,weekdays:[...days.querySelectorAll('input:checked')].map(el=>Number(el.value)),nth:Number(get('nth').value),alternating:Boolean(alternate?.checked),first_person:get('first_person')?.value||''};
    const dayRequired=['weekly','monthly_nth'].includes(kind);const dayInput=days.querySelector('input');dayInput?.setCustomValidity(dayRequired&&!rule.weekdays.length?'Bitte mindestens einen Wochentag auswählen.':'');
    const valid=Boolean(start)&&Number.isInteger(rule.interval)&&rule.interval>=1&&rule.interval<=365&&(!rule.end||rule.end>=start)&&(!dayRequired||rule.weekdays.length>0);
    let text=valid?recurrenceSummary(rule):'Bitte Datum, Wiederholungsabstand und Wochentage prüfen.';
    if(rule.alternating)text+=' · Abwechselnd, Beginn: '+rule.first_person;
    if(kind==='monthly_date'&&Number(start.slice(8))>28)text+=' · Monate ohne diesen Tag werden übersprungen.';
    if(kind==='yearly'&&start.slice(5)==='02-29')text+=' · Jahre ohne den 29. Februar werden übersprungen.';
    control.querySelector('.recurrence-hint').textContent=text;return {rule,valid};
  };
  const init=()=>{
    for(const el of root.querySelectorAll('[data-ui-multi],[data-ui-recurrence],[data-ui-range]')){
      if(initialized.has(el))continue;initialized.add(el);
      if(el.hasAttribute('data-ui-multi'))updateMulti(el);
      if(el.hasAttribute('data-ui-recurrence'))updateRecurrence(el);
      if(el.hasAttribute('data-ui-range'))updateRange(el);
    }
  };
  const click=event=>{
    const target=event.target.closest?.('button'),combo=event.target.closest?.('[data-ui-combobox]');
    if(target?.disabled)return;
    if(target?.hasAttribute('data-ui-combo-toggle')){const open=combo.querySelector('input').getAttribute('aria-expanded')==='true';combo.querySelector('input').focus();if(open)closeCombo(combo);else openCombo(combo);return;}
    if(target?.hasAttribute('data-ui-option')){choose(combo,target,event);return;}
    if(target?.hasAttribute('data-ui-preset')){const box=target.closest('.fui-number'),input=box.querySelector('input');input.value=target.dataset.uiPreset;input.focus();emit(box,event,input.valueAsNumber,{valid:input.checkValidity()});return;}
    if(target?.hasAttribute('data-ui-keep')){const control=target.closest('[data-ui-range]');control.dataset.keep='true';updateRange(control);emit(control,event,null);return;}
    if(target?.hasAttribute('data-ui-select-all')||target?.hasAttribute('data-ui-select-none')){
      const control=target.closest('[data-ui-multi]'),checked=target.hasAttribute('data-ui-select-all');
      control.querySelectorAll('input[type=checkbox]').forEach(el=>{if(!el.disabled&&(!checked||!el.closest('[data-selection-row]').hidden))el.checked=checked;});updateMulti(control);emit(control,event,selection(control));return;
    }
    if(target?.hasAttribute('data-ui-fold-all')){
      const scope=root.getElementById(target.dataset.scope);scope?.querySelectorAll('[data-ui="collapse"]').forEach(el=>{const expanded=target.dataset.uiFoldAll==='true';el.setAttribute('aria-expanded',String(expanded));el.querySelector('.chevron')?.classList.toggle('expanded',expanded);const body=root.getElementById(el.getAttribute('aria-controls'));if(body)body.hidden=!expanded;});return;
    }
    if(target?.hasAttribute('data-ui-cancel-action')){target.closest('dialog')?.close();onAction({action:target.dataset.uiCancelAction,data:{},value:false,element:target,originalEvent:event});return;}
    if(target?.hasAttribute('data-ui-import')){target.closest('[data-ui-backup]').querySelector('input[type=file]').click();return;}
    if(target?.hasAttribute('data-ui-photo-choose')){target.closest('[data-ui-photo]').querySelector('input[type=file]').click();return;}
    if(target?.hasAttribute('data-ui-photo-remove')){const control=target.closest('[data-ui-photo]');photoTokens.set(control,{});control.querySelector('[data-photo-preview]').replaceChildren();control.querySelector('[data-photo-status]').textContent='Foto wird entfernt.';control.querySelector('[data-photo-error]').replaceChildren();target.hidden=true;control.querySelector('input').value='';emit(control,event,null);return;}
    const day=event.target.closest?.('[data-ui-calendar-day]');
    if(day&&!event.target.closest('button,a,input,select,textarea'))emit(day,event,day.dataset.uiCalendarDay,{date:day.dataset.uiCalendarDay});
  };
  const input=event=>{
    const el=event.target,recurrence=el.closest?.('[data-ui-recurrence]');
    if(recurrence){if(el.name==='repeating'&&!el.checked){const alternate=recurrence.querySelector('[name=alternating]');if(alternate)alternate.checked=false;}const {rule,valid}=updateRecurrence(recurrence);emit(recurrence,event,rule,{valid});return;}
    const combo=el.closest?.('[data-ui-combobox]');if(combo&&el.matches('input')){combo.dataset.selected='';combo.querySelectorAll('[data-ui-option]').forEach(o=>o.setAttribute('aria-selected','false'));openCombo(combo);return;}
    const multi=el.closest?.('[data-ui-multi]');if(multi&&el.type==='search'){updateMulti(multi);return;}
    const range=el.closest?.('[data-ui-range]');if(range){range.dataset.keep='false';emit(range,event,updateRange(range),{phase:'input'});return;}
    const number=el.closest?.('.fui-number');if(number)emit(number,event,el.valueAsNumber,{valid:el.checkValidity()});
    const season=el.closest?.('[data-ui-season]');if(season&&el.type!=='checkbox'){el.setCustomValidity(parseMonthDay(el.value)?'':'Bitte ein gültiges Datum als TT.MM. eingeben.');}
  };
  const change=async event=>{
    const el=event.target,recurrence=el.closest?.('[data-ui-recurrence]');
    if(recurrence){if(el.name==='repeating'&&!el.checked){const alternate=recurrence.querySelector('[name=alternating]');if(alternate)alternate.checked=false;}const {rule,valid}=updateRecurrence(recurrence);emit(recurrence,event,rule,{valid});return;}
    const multi=el.closest?.('[data-ui-multi]');if(multi&&el.type==='checkbox'){updateMulti(multi);emit(multi,event,selection(multi));return;}
    const checks=el.closest?.('[data-ui-checks]');if(checks){emit(checks,event,selection(checks));return;}
    const completion=el.closest?.('[data-ui-completion]');if(completion){emit(completion,event,el.checked,{checked:el.checked});return;}
    const range=el.closest?.('[data-ui-range]');if(range){range.dataset.keep='false';emit(range,event,updateRange(range),{phase:'change'});return;}
    const window=el.closest?.('[data-ui-time-window]');if(window){const start=window.querySelector('[name=start]'),end=window.querySelector('[name=end]');emit(window,event,{start:start.value,end:end.value},{valid:start.checkValidity()&&end.checkValidity()});return;}
    const dates=el.closest?.('[data-ui-date-range]');if(dates){const start=dates.querySelector('[name=start]'),end=dates.querySelector('[name=end]');end.min=start.value;emit(dates,event,{start:start.value,end:end.value},{valid:start.checkValidity()&&end.checkValidity()});return;}
    const season=el.closest?.('[data-ui-season]');if(season){const enabled=season.querySelector('[data-season-enabled]').checked;season.querySelector('.season-dates').hidden=!enabled;const fields=[...season.querySelectorAll('input:not([type=checkbox])')];fields.forEach(f=>{f.disabled=!enabled;f.setCustomValidity(enabled&&!parseMonthDay(f.value)?'Bitte ein gültiges Datum als TT.MM. eingeben.':'');});emit(season,event,{enabled,start:parseMonthDay(fields[0].value),end:parseMonthDay(fields[1].value)},{valid:!enabled||fields.every(f=>f.checkValidity())});return;}
    const backup=el.closest?.('[data-ui-backup]');if(backup&&el.type==='file'&&el.files?.[0]){
      const file=el.files[0],box=backup.querySelector('[data-backup-feedback]');box.textContent='Datei wird gelesen …';
      try{const value=await readJSONFile(file,{maxBytes:Number(backup.dataset.maxBytes)});if(disposed||!backup.isConnected)return;box.replaceChildren();emit(backup,event,value,{file});}catch(error){if(!disposed&&backup.isConnected)box.innerHTML=feedback(error.message,{kind:'error'});}el.value='';return;
    }
    const photo=el.closest?.('[data-ui-photo]');if(photo&&el.type==='file'&&el.files?.[0]){
      const token={};photoTokens.set(photo,token);const controls=[...photo.querySelectorAll('button,input')].filter(n=>!n.disabled);controls.forEach(n=>n.disabled=true);const status=photo.querySelector('[data-photo-status]'),error=photo.querySelector('[data-photo-error]');error.replaceChildren();status.textContent='Foto wird aufbereitet …';
      try{const src=await compressPhoto(el.files[0]);if(disposed||!photo.isConnected||photoTokens.get(photo)!==token)return;photo.querySelector('[data-photo-preview]').innerHTML=photoPreview({src});photo.querySelector('[data-ui-photo-remove]').hidden=false;status.textContent='Foto bereit.';emit(photo,event,src);}catch(err){if(!disposed&&photo.isConnected&&photoTokens.get(photo)===token){status.textContent='Bitte ein anderes Foto wählen.';error.innerHTML=feedback(err.message,{kind:'error'});}}finally{controls.forEach(n=>n.disabled=false);el.value='';}return;
    }
  };
  const colour=(control,x,y,event)=>{
    const radius=Math.hypot(x,y);if(radius>1){x/=radius;y/=radius;}
    const rgb=hsvToRGB((Math.atan2(x,-y)*180/Math.PI+360)%360,Math.min(1,radius)),hex='#'+rgb.map(n=>n.toString(16).padStart(2,'0')).join('');control.dataset.rgb=rgb.join(',');
    Object.assign(control.querySelector('.colour-marker').style,{left:(50+x*50)+'%',top:(50+y*50)+'%',background:hex});control.querySelector('[data-colour-swatch]').style.background=hex;control.querySelector('output').textContent=hex.toUpperCase();emit(control,event,rgb,{hex});
  };
  const pointer=event=>{
    const wheel=event.target.closest?.('.colour-wheel');if(!wheel||wheel.getAttribute('aria-disabled')==='true'||event.isPrimary===false)return;
    if(event.type==='pointermove'&&!wheel.hasPointerCapture(event.pointerId))return;
    if(event.type==='pointerdown'){if(event.button!==0)return;wheel.setPointerCapture(event.pointerId);wheel.focus();}
    const r=wheel.getBoundingClientRect();if(!r.width)return;event.preventDefault();colour(wheel.closest('[data-ui-colour]'),(event.clientX-r.left-r.width/2)/(r.width/2),(event.clientY-r.top-r.height/2)/(r.height/2),event);
  };
  const keydown=event=>{
    const el=event.target,combo=el.closest?.('[data-ui-combobox]');
    if(combo&&el.matches('input')){
      if(event.key==='Tab'){closeCombo(combo);return;}
      if(event.key==='Escape'&&el.getAttribute('aria-expanded')==='true'){event.preventDefault();event.stopPropagation();closeCombo(combo);return;}
      if(['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();if(el.getAttribute('aria-expanded')!=='true')openCombo(combo);const list=options(combo),index=list.findIndex(n=>n.classList.contains('active')),next=event.key==='ArrowDown'?Math.min(index+1,list.length-1):Math.max(index-1,0);list.forEach(n=>n.classList.remove('active'));if(list[next]){list[next].classList.add('active');el.setAttribute('aria-activedescendant',list[next].id);list[next].scrollIntoView({block:'nearest'});}return;}
      if(event.key==='Enter'&&el.getAttribute('aria-expanded')==='true'){event.preventDefault();const list=options(combo),selected=list.find(n=>n.classList.contains('active'))||(list.length===1?list[0]:null);if(selected)choose(combo,selected,event);return;}
    }
    const wheel=el.closest?.('.colour-wheel');if(wheel&&wheel.getAttribute('aria-disabled')!=='true'&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key)){
      event.preventDefault();const control=wheel.closest('[data-ui-colour]'),{h,s}=rgbToHSV(control.dataset.rgb.split(',').map(Number)),a=h*Math.PI/180,step=event.shiftKey?.1:.02;let x=Math.sin(a)*s,y=-Math.cos(a)*s;
      if(event.key==='Home'){x=0;y=0;}else if(event.key==='End'){x=Math.sin(a);y=-Math.cos(a);}else if(event.key==='ArrowLeft')x-=step;else if(event.key==='ArrowRight')x+=step;else if(event.key==='ArrowUp')y-=step;else y+=step;
      colour(control,x,y,event);
    }
  };
  const focusin=event=>{const box=event.target.closest?.('[data-ui-combobox]');if(box&&event.target.matches('input'))openCombo(box);};
  const outside=event=>{root.querySelectorAll('[data-ui-combobox]').forEach(box=>{if(!box.contains(event.target))closeCombo(box);});};
  const focusout=event=>{const box=event.target.closest?.('[data-ui-combobox]');if(box&&event.relatedTarget&&!box.contains(event.relatedTarget))closeCombo(box);};
  const listeners={click,input,change,keydown,focusin,focusout,pointerdown:pointer,pointermove:pointer};
  for(const [type,fn] of Object.entries(listeners))root.addEventListener(type,fn);
  root.addEventListener('pointerdown',outside);const observer=new MutationObserver(init);observer.observe(root,{childList:true,subtree:true});init();
  return ()=>{disposed=true;observer.disconnect();for(const [type,fn] of Object.entries(listeners))root.removeEventListener(type,fn);root.removeEventListener('pointerdown',outside);};
}

/** Source: Essensplaner horizontal swipe, Gartenarbeit top-of-page pull. Opt-in per surface. */
function bindGestures(element,{onSwipeLeft,onSwipeRight,onPullDown,canPull=()=>!element.getRootNode().querySelector?.('dialog[open]')&&(element.ownerDocument.defaultView.scrollY<=0),swipeThreshold=60,pullThreshold=85}={}) {
  let start=null;
  const touchstart=event=>{const target=event.target;start=event.touches.length===1&&!target.closest?.('input,select,textarea,button,a,.colour-wheel')?[event.touches[0].clientX,event.touches[0].clientY,canPull()]:null;};
  const cancel=()=>{start=null;};
  const touchend=event=>{if(!start||!event.changedTouches.length)return;const [x,y,pull]=start;start=null;const dx=event.changedTouches[0].clientX-x,dy=event.changedTouches[0].clientY-y;if(Math.abs(dx)>swipeThreshold&&Math.abs(dx)>Math.abs(dy)*1.2)(dx<0?onSwipeLeft:onSwipeRight)?.();else if(pull&&dy>pullThreshold&&dy>Math.abs(dx)*1.2)onPullDown?.();};
  element.addEventListener('touchstart',touchstart,{passive:true});element.addEventListener('touchend',touchend,{passive:true});element.addEventListener('touchcancel',cancel,{passive:true});
  return ()=>{cancel();element.removeEventListener('touchstart',touchstart);element.removeEventListener('touchend',touchend);element.removeEventListener('touchcancel',cancel);};
}

return {UI_VERSION,UI_CSS,ICON_NAMES,icon,escapeHtml,button,programAddButton,programOrderButtons,iconButton,navigation,toggle,filterButton,section,row,field,selectField,dialog,notice,versionInfo,bindUI,textareaField,numberControl,checkboxGroup,weekdayPicker,combobox,multiSelect,rangeControl,whiteTemperatureControl,parseColour,rgbToHSV,hsvToRGB,colourPicker,timeWindow,parseMonthDay,seasonPicker,dateRange,recurrenceEditor,programGroup,programRow,actionRow,actionEditor,foldControls,sensorOverview,statusBadge,counter,accountTile,accountTiles,historyList,groupedHistory,statisticsTable,dateNavigation,dateKey,calendarDates,weekCalendar,completionRow,dayAgenda,languagePicker,backupControls,helpContent,panelHeader,feedback,formError,emptyState,loadingState,busyButton,confirmDialog,photoPreview,photoPicker,photoDialog,recurrenceSummary,readJSONFile,downloadJSON,compressPhoto,bindObjects,bindGestures};
})();
// Home Assistant's MediaPlayerEntityFeature flags, verified against core 2026.11.1.
export const FEATURES = Object.freeze({pause:1,seek:2,volume:4,mute:8,previous:16,next:32,playMedia:512,stop:4096,play:16384,shuffle:32768});
export const RADIO_ROOT = 'media-source://radio_browser';
export const MUSIC_VERSION = '1.10.0';
export const CONTROL_DEFAULTS = Object.freeze({play_pause:true,previous:true,next:true,shuffle:true,volume:true});

export function normalizeConfig(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) throw new Error('Die Kartenkonfiguration muss ein Objekt sein.');
  if (typeof config.entity !== 'string' || !/^media_player\.[a-z0-9_]+$/.test(config.entity)) throw new Error('Bitte eine Sonos-Box als media_player auswählen.');
  if (config.name !== undefined && typeof config.name !== 'string') throw new Error('Der Kartenname muss ein Text sein.');
  if (config.music_assistant_entity && (typeof config.music_assistant_entity !== 'string' || !/^media_player\.[a-z0-9_]+$/.test(config.music_assistant_entity))) throw new Error('Bitte die Music-Assistant-Entität derselben Sonos-Box auswählen.');
  if (config.controls !== undefined && (!config.controls || typeof config.controls !== 'object' || Array.isArray(config.controls))) throw new Error('controls muss ein Objekt sein.');
  const controls = {...CONTROL_DEFAULTS};
  for (const key of Object.keys(controls)) {
    if (config.controls?.[key] !== undefined) {
      if (typeof config.controls[key] !== 'boolean') throw new Error(`controls.${key} muss true oder false sein.`);
      controls[key] = config.controls[key];
    }
  }
  return {...config,type:'custom:music-manager-card',entity:config.entity,music_assistant_entity:config.music_assistant_entity||'',name:config.name ?? '',controls};
}

export function hasFeature(state, name) { return Boolean((Number(state?.attributes?.supported_features) || 0) & FEATURES[name]); }
export function isAvailable(state) { return Boolean(state && !['unknown','unavailable'].includes(state.state)); }
export function volumePercent(value) { return Number.isFinite(value) ? Math.round(Math.max(0,Math.min(1,value))*100) : null; }
export function formatTime(seconds) {
  const n=Math.max(0,Math.floor(Number.isFinite(seconds)?seconds:0));
  const mins=Math.floor(n/60),secs=String(n%60).padStart(2,'0');
  return mins>=60?`${Math.floor(mins/60)}:${String(mins%60).padStart(2,'0')}:${secs}`:`${mins}:${secs}`;
}
export function playbackProgress(state,now=Date.now()) {
  const a=state?.attributes||{},duration=a.media_duration;
  if(!Number.isFinite(duration)||duration<=0)return null;
  let position=Number.isFinite(a.media_position)?a.media_position:0;
  const anchor=typeof a.media_position_updated_at==='string'?Date.parse(a.media_position_updated_at):NaN;
  if(state.state==='playing'&&Number.isFinite(anchor))position+=Math.max(0,(now-anchor)/1000);
  return {duration,position:Math.max(0,Math.min(duration,position))};
}
export function mediaIdentity(state) {
  const a=state?.attributes||{};
  return JSON.stringify([a.media_content_id||'',a.media_title||'',a.media_artist||'',a.media_duration??null]);
}
// The native Sonos transport is stronger evidence than a cached MA queue.
// MA uses /flow/ and /single/ stream routes, also when Sonos wraps a flow
// stream in x-rincon-mp3radio. Group members expose only their coordinator.
export function sonosContentId(state) {
  return typeof state?.attributes?.media_content_id==='string'?state.attributes.media_content_id:'';
}
export function sonosPlaybackSource(state) {
  if(!isAvailable(state))return '';
  const a=state.attributes||{},id=sonosContentId(state);
  if(!id || /^x-rincon:/i.test(id))return '';
  if(/(?:^https?:|^x-rincon-mp3radio:).*\/(?:flow|single)\/[^/]+\/[^/]+/i.test(id))return 'apple';
  if(isRadioId(id) || /^(?:x-rincon-mp3radio|x-sonosapi-(?:stream|radio)):/i.test(id) ||
    (/^https?:/i.test(id) && !(Number.isFinite(a.media_duration)&&a.media_duration>0)))return 'radio';
  return 'native';
}
export function isRadioId(value) { return typeof value === 'string' && (value === RADIO_ROOT || value.startsWith(RADIO_ROOT + '/')); }
export function normalizeMedia(items) {
  const seen = new Set();
  return (Array.isArray(items) ? items : []).filter(item => {
    if (!item || !isRadioId(item.media_content_id) || seen.has(item.media_content_id)) return false;
    seen.add(item.media_content_id);
    return item.can_play || item.can_expand;
  }).map(item => ({...item,title:String(item.title || 'Unbekannter Sender')}));
}
export function errorText(error) { return String(error?.message || error?.code || error || 'Unbekannter Fehler'); }
export function stationPayload(station) {
  if (!station?.can_play || !isRadioId(station.media_content_id) || station.media_content_id === RADIO_ROOT) throw new Error('Ungültiger Radiosender.');
  return {media_content_id:station.media_content_id,media_content_type:station.media_content_type || 'audio/mpeg',extra:{title:station.title}};
}
export function playbackAction(state, station) {
  if (['playing','buffering'].includes(state?.state)) {
    if (hasFeature(state,'pause')) return 'media_pause';
    if (hasFeature(state,'stop')) return 'media_stop';
    return null;
  }
  if (hasFeature(state,'play')) return 'media_play';
  return station && hasFeature(state,'playMedia') ? 'play_media' : null;
}
export function sonosOptions(hass, entries) {
  // Registry platform identifies Sonos, including Symfonisk, without name guessing.
  const registry = entries || Object.values(hass?.entities || {});
  return registry.filter(e => e.platform === 'sonos' && e.entity_id?.startsWith('media_player.') && !e.disabled_by && hass?.states?.[e.entity_id])
    .map(e => ({value:e.entity_id,label:hass.states[e.entity_id].attributes?.friendly_name || e.entity_id,description:e.entity_id}))
    .sort((a,b)=>a.label.localeCompare(b.label));
}

export function musicAssistantOptions(hass, entries, sourceEntity) {
  const registry=entries || Object.values(hass?.entities || {});
  const uid=id=>String(id||'').toLowerCase().match(/rincon_[a-z0-9]+/)?.[0];
  const source=registry.find(e=>e.entity_id===sourceEntity), sourceUid=uid(source?.unique_id);
  return registry.filter(e=>e.platform==='music_assistant' && e.entity_id?.startsWith('media_player.') && !e.disabled_by && hass?.states?.[e.entity_id] && (!sourceUid || uid(e.unique_id)===sourceUid))
    .map(e=>({value:e.entity_id,label:hass.states[e.entity_id].attributes?.friendly_name||e.entity_id,description:e.entity_id}))
    .sort((a,b)=>a.label.localeCompare(b.label));
}

// HA authenticates these commands as the current user; no entity/card/user ID
// is included in the storage key or payload.
export const FAVORITES_KEY = 'music_manager_favorites';
export const ALARM_SONGS_KEY = 'music_manager_alarm_songs';
export function stationLogo(value) {
  if (typeof value !== 'string' || value.length > 4096) return '';
  try {
    const url = new URL(value, 'https://home-assistant.local');
    return ['http:','https:'].includes(url.protocol) && !url.username && !url.password ? value : '';
  } catch { return ''; }
}
export function normalizeFavorites(value) {
  const result=[],seen=new Set();
  for(const s of Array.isArray(value)?value:[]) {
    const item=s?.kind==='apple_music'?appleFavorite(s):normalizeMedia([s]).filter(s=>s.can_play&&s.media_content_id!==RADIO_ROOT).map(s=>({
      media_content_id:s.media_content_id,media_content_type:String(s.media_content_type||'audio/mpeg'),
      title:s.title,thumbnail:stationLogo(s.thumbnail),can_play:true,can_expand:false
    }))[0];
    if(item&&!seen.has(item.media_content_id)){result.push(item);seen.add(item.media_content_id);}
  }
  return result;
}
export function appleFavorite(item) {
  const uri=item?.uri,match=typeof uri==='string'&&uri.match(/^apple_music--[a-zA-Z0-9._-]{1,128}:\/\/(track|album|playlist)\/[a-zA-Z0-9._-]{1,256}$/);
  if(!match||item.media_type!==match[1]||typeof item.title!=='string'||!item.title.trim())return null;
  return {kind:'apple_music',uri,media_type:match[1],media_content_id:uri,media_content_type:match[1],
    title:item.title,description:String(item.description||''),thumbnail:stationLogo(item.thumbnail),can_play:true,can_expand:false,
    ...(match[1]==='track'&&item.alarm_song===true?{alarm_song:true}:{})};
}
const favoriteQueues = new WeakMap();
async function serializeUserData(hass, update) {
  if (!hass.user?.id) throw new Error('Bitte mit einem Home-Assistant-Benutzer anmelden.');
  // Serialize changes across this user's cards, and read immediately before
  // each write so another card's favorites are preserved.
  const session=hass.connection || hass;
  let users=favoriteQueues.get(session);
  if(!users){users=new Map();favoriteQueues.set(session,users);}
  const key=hass.user.id, previous=users.get(key)||Promise.resolve();
  const operation=previous.catch(()=>{}).then(update);
  users.set(key,operation);
  try{return await operation;}finally{if(users.get(key)===operation)users.delete(key);}
}
async function updateFavorites(hass, update) {
  return serializeUserData(hass,async()=>{
    const response=await hass.callWS({type:'frontend/get_user_data',key:FAVORITES_KEY});
    const next=update(normalizeFavorites(response?.value));
    await hass.callWS({type:'frontend/set_user_data',key:FAVORITES_KEY,value:next});
    return next;
  });
}
export function normalizeAlarmSongs(value) {
  return normalizeFavorites(value).filter(f=>f.kind==='apple_music'&&f.media_type==='track').map(f=>{const next={...f};delete next.alarm_song;return next;});
}
async function migrateLegacyAlarmSongs(hass) {
  const response=await hass.callWS({type:'frontend/get_user_data',key:FAVORITES_KEY});
  const raw=Array.isArray(response?.value)?response.value:[],legacy=raw.filter(f=>f?.alarm_song===true&&appleFavorite(f)?.media_type==='track');
  if(!legacy.length)return;
  const existing=await hass.callWS({type:'frontend/get_user_data',key:ALARM_SONGS_KEY});
  // Copy first. If pruning fails, the next attempt merges the same songs
  // without losing either the old markers or an already migrated selection.
  const songs=normalizeAlarmSongs([...(Array.isArray(existing?.value)?existing.value:[]),...legacy]);
  await hass.callWS({type:'frontend/set_user_data',key:ALARM_SONGS_KEY,value:songs});
  await hass.callWS({type:'frontend/set_user_data',key:FAVORITES_KEY,value:raw.filter(f=>!legacy.includes(f))});
}
export async function migrateAlarmSongs(hass) { return serializeUserData(hass,()=>migrateLegacyAlarmSongs(hass)); }
export async function saveFavorite(hass, favorite, enabled) {
  const item=normalizeFavorites([favorite])[0];
  if(!item)throw new Error('Ungültiger Favorit.');
  return updateFavorites(hass,favorites=>{
    const index=favorites.findIndex(s=>s.media_content_id===item.media_content_id);
    const next=favorites.filter(s=>s.media_content_id!==item.media_content_id);
    if(enabled)next.splice(index<0?next.length:index,0,{...favorites[index],...item});
    return next;
  });
}
export async function saveAlarmSong(hass,favorite,enabled) {
  const item=appleFavorite(favorite);
  if(item?.media_type!=='track')throw new Error('Nur einzelne Apple-Music-Titel können Wecklieder sein.');
  return serializeUserData(hass,async()=>{
    await migrateLegacyAlarmSongs(hass);
    const response=await hass.callWS({type:'frontend/get_user_data',key:ALARM_SONGS_KEY});
    const songs=normalizeAlarmSongs(response?.value),index=songs.findIndex(f=>f.uri===item.uri);
    const next=songs.filter(f=>f.uri!==item.uri);
    if(enabled)next.splice(index<0?next.length:index,0,normalizeAlarmSongs([item])[0]);
    await hass.callWS({type:'frontend/set_user_data',key:ALARM_SONGS_KEY,value:next});
    return next;
  });
}
export async function moveFavorite(hass,id,direction) {
  if(!['up','down'].includes(direction))throw new Error('Ungültige Sortierrichtung.');
  return updateFavorites(hass,favorites=>{
    const index=favorites.findIndex(s=>s.media_content_id===id),target=index+(direction==='up'?-1:1);
    if(index<0||target<0||target>=favorites.length)return favorites;
    const next=[...favorites];[next[index],next[target]]=[next[target],next[index]];return next;
  });
}

/** Dialog layout shared by the music card and the alarm entities row. */
export const MUSIC_DIALOG_CSS = `
  .modal{max-height:90dvh}
  .modal .modal-body{min-height:0;flex:1;overscroll-behavior:contain}
  .modal footer:empty{display:none}
  .modal button{min-height:44px}
  .modal .modal-head .edit-button{min-width:44px}
  .modal .row-text{min-width:0;overflow-wrap:anywhere}
  @media(max-width:600px){
    .modal{inset:0;margin:0;width:100%;max-width:100%;height:100dvh;max-height:100dvh;border-radius:0}
    .modal .modal-head{padding:calc(8px + env(safe-area-inset-top,0px)) 12px 8px 16px}
    .modal .modal-body{padding:16px 16px calc(20px + env(safe-area-inset-bottom,0px))}
    .modal input:not([type=range]):not([type=checkbox]){font-size:16px;min-height:44px}
  }
`;

const {
  UI_CSS, UI_VERSION, row, button, iconButton, field, combobox,
  section, toggle, rangeControl, dialog, notice, versionInfo, emptyState,
  loadingState, bindUI, escapeHtml, programOrderButtons
} = MusicManagerUI;



// UI Kit components remain unchanged; the music controls have their own
// scoped presentation to match the supplied Home Assistant media controls.
const MUSIC_CSS = `
  :host{min-width:0}
  .music-stack,.music-browser,.music-editor{display:grid;gap:16px;min-width:0}
  .music-header{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;min-width:0;padding-bottom:12px;border-bottom:1px solid var(--divider-color,#e0e0e0)}
  .music-now-playing{flex:1;min-width:0}
  .music-title{margin:0;font-size:22px;font-weight:600;line-height:1.25;color:var(--primary-text-color,#212121);overflow-wrap:anywhere}
  .music-detail{margin-top:6px;font-size:13px;line-height:1.4;color:var(--secondary-text-color,#727272);overflow-wrap:anywhere}
  .music-box{flex:0 1 auto;min-width:0;max-width:38%;text-align:end;font-size:13px;font-weight:500;line-height:1.4;color:var(--secondary-text-color,#727272);overflow-wrap:anywhere}
  .music-controls{display:grid;gap:12px;min-width:0}
  .music-transport{display:flex;gap:12px}
  .music-transport button{flex:1;min-width:0;height:44px;display:grid;place-items:center;padding:0;border-radius:12px;background:var(--secondary-background-color,#f2f2f2);color:var(--primary-text-color,#212121)}
  .music-transport button:disabled{color:var(--disabled-text-color,#bdbdbd);opacity:1}
  .music-transport button:hover:enabled{background:color-mix(in srgb,var(--primary-color,#03a9f4) 12%,var(--secondary-background-color,#f2f2f2))}
  .music-icon{width:20px;height:20px;fill:currentColor;vertical-align:middle}
  .music-volume{min-width:0}
  .music-volume ha-control-slider{display:block;width:100%}
  .music-apple-playback{display:grid;gap:8px;min-width:0}
  .music-transport [data-action="shuffle"][aria-pressed="true"]{color:var(--primary-color,#03a9f4);background:color-mix(in srgb,var(--primary-color,#03a9f4) 14%,transparent)}
  #music-seek-control .slider-head label{display:none}
  #music-seek-control .slider-head{justify-content:flex-end}
  .music-favorites:empty,#music-favorite-status:empty,#music-player-status:empty{display:none}
  .music-apple-results [aria-pressed="false"] .music-icon,#music-radio-results [aria-pressed="false"] .music-icon{fill:none;stroke:currentColor;stroke-width:1.7}
  .music-favorites{display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:12px;min-width:0}
  .music-favorite{display:grid;gap:6px;align-content:start;justify-items:center;min-width:0;min-height:80px;padding:8px;border-radius:12px;background:var(--secondary-background-color,#f2f2f2)}
  .music-favorite>span:last-child{max-width:100%;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .music-station-logo{position:relative;display:grid;place-items:center;width:48px;height:48px;flex-shrink:0;border-radius:8px;background:var(--card-background-color,#fff);color:var(--secondary-text-color,#727272);overflow:hidden}
  .music-station-logo img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:var(--card-background-color,#fff)}
  .music-station-row{display:flex;align-items:center;gap:12px;min-width:0}
  .music-station-row>.setting-row{flex:1;min-width:0}
  .music-favorite-actions{display:flex;align-items:center;gap:4px;flex-wrap:nowrap}
  .music-apple-logo{display:block;width:48px;height:48px;flex-shrink:0;border-radius:10px}
  .music-apple-results .setting-row{min-width:0}
  .music-results{min-width:0;display:grid;gap:12px}
  .music-search-line{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:end;gap:8px}
  .music-library-nav,.music-manage-nav{display:grid;gap:8px;min-width:0}
  .music-library-nav{grid-template-columns:repeat(3,minmax(0,1fr))}
  .music-manage-nav{grid-template-columns:repeat(2,minmax(0,1fr))}
  .music-library-nav button{border:1px solid var(--divider-color,#ddd)}
  .music-library-nav button[aria-pressed="true"]{background:var(--primary-color,#03a9f4);color:var(--text-primary-color,#fff);border-color:var(--primary-color,#03a9f4)}
  .music-catalog-item{display:grid;gap:12px;padding:12px;border:1px solid var(--divider-color,#ddd);border-radius:12px;min-width:0}
  .music-result-actions{display:grid;grid-template-columns:44px 44px minmax(0,1fr);gap:8px;align-items:stretch}
  .music-result-actions.is-container{grid-template-columns:44px minmax(0,1fr) minmax(0,1fr)}
  .music-result-actions.is-radio{grid-template-columns:44px minmax(0,1fr)}
  .music-result-actions button{padding:8px;min-width:0}
  .music-result-actions .music-icon{width:22px;height:22px}
  .music-result-actions [data-action="apple-alarm-song"] .music-icon{fill:currentColor;stroke:none}
  .music-song-actions{display:flex;justify-content:flex-end}
  .music-song-actions button{min-width:100px}
  #music-apple-account:empty,#music-apple-status:empty{display:none}
  #music-alarm-song-tools{display:grid;gap:12px}
  .music-source-actions button{min-height:44px}
  @media(max-width:600px){
    .music-source-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
    .music-source-actions button{border:1px solid var(--divider-color,#ddd);padding:8px}
    .music-favorites{grid-template-columns:repeat(auto-fill,minmax(88px,1fr));gap:10px}
    .music-favorite{min-height:104px}
    .music-transport{gap:8px}
    .music-transport button{height:48px}
    .music-browser{gap:12px}
    .music-manage-nav button{padding:8px}
    #music-search-form>.toolbar{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}
    #music-search-form [data-action="manage-favorites"]{grid-column:1/-1}
    .music-favorite-actions{flex-wrap:wrap}
    .music-favorite-actions .program-order button{width:44px;height:44px}
    .music-favorite-actions .check{min-height:44px;min-width:44px;display:grid;place-items:center}
  }
`;
const APPLE_MUSIC_LOGO = `<svg class="music-apple-logo" viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="apple-music-gradient" x2="0" y2="1"><stop stop-color="#fa586a"/><stop offset="1" stop-color="#e82948"/></linearGradient></defs><rect width="48" height="48" rx="10" fill="url(#apple-music-gradient)"/><path fill="#fff" d="M33.7 9.1 20.2 12c-.8.2-1.2.7-1.2 1.5v19.1c-1.1-.6-2.6-.5-4 .1-2.3.8-3.7 2.7-3.2 4.3.5 1.6 2.7 2.2 5 1.4 2.1-.7 3.6-2.3 3.6-4V20.1l12.1-2.6v11.6c-1.1-.5-2.5-.4-3.9.1-2.3.8-3.8 2.7-3.2 4.3.5 1.6 2.7 2.2 5 1.4 2.2-.8 3.6-2.4 3.6-4V10.2c0-.8-.3-1.2-.9-1.1Z"/></svg>`;
const APPLE_SETUP = 'Für Apple Music: Music Manager im Marketplace als Integration installieren und unter Geräte & Dienste → Music Manager → Konfigurieren Music Assistant und deinen HA-Benutzer zuordnen. Die jeweilige Sonos-Box wird automatisch in Music Assistant gefunden. Alle gewünschten Boxen müssen dort über den Sonos-Player-Anbieter eingerichtet und für deinen Benutzer freigegeben sein.';
const MUSIC_ICONS = {
  alarmFilled:'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm-1 3h2v4.4l3 1.8-1 1.7-4-2.4V7ZM3.5 1.8l1.3 1.5-3.4 2.9L.1 4.7l3.4-2.9Zm17 0 3.4 2.9-1.3 1.5-3.4-2.9 1.3-1.5Z',
  alarm:'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 2a6 6 0 1 1 0 12 6 6 0 0 1 0-12Zm-1 1h2v5.4l3 1.8-1 1.7-4-2.4V7ZM3.5 1.8l1.3 1.5-3.4 2.9L.1 4.7l3.4-2.9Zm17 0 3.4 2.9-1.3 1.5-3.4-2.9 1.3-1.5Z',
  previous:'M6 5h2v14H6zM18 5v14l-9-7z',next:'M16 5h2v14h-2zM6 5l9 7-9 7z',
  play:'M8 5v14l11-7z',pause:'M6 5h4v14H6zM14 5h4v14h-4z',stop:'M6 6h12v12H6z',
  star:'m12 2.5 2.9 5.9 6.5 1-4.7 4.6 1.1 6.5-5.8-3.1-5.8 3.1 1.1-6.5-4.7-4.6 6.5-1z',
  radio:'M4 7h16v13H4zM6 3l13-2v2L6 5zM6 9v3h12V9zM7 14h5v4H7zM15 14h3v2h-3z',
  shuffle:'m16 3 5 4-5 4V8h-2l-4 5-4 5H3v-2h2l4-5 4-5h3V3ZM3 6h3l3 4-1.3 1.6L5 8H3V6Zm9 7.4 2 2.6h2v-3l5 4-5 4v-3h-3l-2.3-3 1.3-1.6Z'
};
const musicIcon = name => `<svg class="music-icon" data-music-icon="${name}" viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="${MUSIC_ICONS[name]}"></path></svg>`;
function musicButton({label,action,icon,disabled=false,data={},pressed}) {
  return button({label,action,disabled,data}).replace('<button ',`<button aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}"${pressed===undefined?'':` aria-pressed="${pressed}"`} `).replace(`<span>${escapeHtml(label)}</span>`,musicIcon(icon));
}
function logoMarkup(station) {
  const src=stationLogo(station.thumbnail);
  return `<span class="music-station-logo" aria-hidden="true">${station.kind==='apple_music'?APPLE_MUSIC_LOGO:musicIcon('radio')}${src?`<img src="${escapeHtml(src)}" alt="" loading="lazy" referrerpolicy="no-referrer">`:''}</span>`;
}

class MusicManagerCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode:'open'});
    this._favorites = [];
    this._alarmSongs=[];this._alarmSongEpoch=0;this._alarmSongLoading=false;this._alarmSongError='';
    this._favoriteMode = false;
    this._favoriteEpoch = 0;
    this._favoriteLoading = false;
    this._favoriteBusy = false;
    this._favoriteError = '';
    this._epoch = 0;
    this._request = 0;
    this._browserItems = [];
    this._path = [];
    this._query = '';
    this._busy = false;
    this._error = '';
    this._radioError = '';
    this._browseLoading = false;
    this._browseReady = false;
    this._canSearch = true;
    this._searchMode = false;
    this._volumeInteracting = false;
    this._appleRequest=0;this._appleItems=[];this._appleAccount='';this._appleError='';
    this._appleLoading=false;this._appleView='playlist';this._appleMore=false;
  }

  static getConfigElement() { return document.createElement('music-manager-card-editor'); }
  static getStubConfig(hass) {
    const entity = sonosOptions(hass)[0]?.value || '';
    return {type:'custom:music-manager-card',entity,controls:{...CONTROL_DEFAULTS}};
  }
  getCardSize() { return 6; }
  getGridOptions() { return {columns:12,rows:'auto',min_columns:6,min_rows:3}; }

  setConfig(config) {
    const next = normalizeConfig(config);
    const changed = this._config?.entity !== next.entity || this._config?.music_assistant_entity !== next.music_assistant_entity;
    this._config = next;
    if (changed) {
      this._playbackSource=null;this._playbackIntent=null;this._radioContentId=null;this._cancelSeek();
      this._epoch++;
      this._request++;
      this._busy = false;
      this._error = '';
      this._selectedStation = null;
      this._dialog?.close();
      this._resetApple();
    }
    this._ensureDOM();
    this._loadNativeVolume();
    this._renderPlayer();
    this._resolveApplePlayer();
  }

  set hass(hass) {
    const previous = this._state;
    const userChanged=this._hass && (this._hass.user?.id!==hass.user?.id || this._hass.connection!==hass.connection);
    this._hass = hass;
    if (!this._config) return;
    this._ensureDOM();
    if(userChanged){this._epoch++;this._busy=false;this._playbackSource=null;this._selectedStation=null;this._playbackIntent=null;this._radioContentId=null;this._cancelSeek();this._resetApple();}
    this._syncRadioStation();
    if(mediaIdentity(previous)!==mediaIdentity(this._state))this._cancelSeek();
    if(this._hass.states?.[this._musicAssistantEntity]?.attributes?.active_queue)this._applePreferred=false;
    this._connectFavorites();
    this._connectAlarmSongs();
    this._loadNativeVolume();
    if (previous !== this._state || !this._player.firstChild) this._renderPlayer();
    this._resolveApplePlayer();
  }
  get _controlEntity() {
    const native=this._hass?.states?.[this._config?.entity];
    const entity=this._musicAssistantEntity, state=this._hass?.states?.[entity];
    const intent=this._playbackIntent;
    // Hold a successful command while Sonos still reports its previous URI.
    // Apple starts have a bounded grace period; radio must never fall back to
    // an old queue just because MA sends another metadata update.
    if(intent && (intent.source!=='radio'||!this._radioContentId) && sonosContentId(native)===intent.previousId &&
      (intent.source==='radio' || Date.now()<intent.until))return intent.source==='radio'||!isAvailable(state)?this._config?.entity:entity;
    const source=sonosPlaybackSource(native);
    if(source==='radio'||source==='native')return this._config?.entity;
    if(source==='apple')return isAvailable(state)?entity:this._config?.entity;
    if(this._playbackSource==='radio')return this._config?.entity;
    return isAvailable(state) && (state.attributes?.active_queue || this._applePreferred) ? entity : this._config?.entity;
  }
  _syncRadioStation() {
    if(this._playbackSource!=='radio'||!this._selectedStation)return;
    const native=this._hass?.states?.[this._config?.entity],id=sonosContentId(native);
    if(!id || (!this._radioContentId && id===this._playbackIntent?.previousId))return;
    if(!this._radioContentId && sonosPlaybackSource(native)!=='apple'){this._radioContentId=id;return;}
    if(id!==this._radioContentId){this._selectedStation=null;this._playbackSource=null;this._playbackIntent=null;}
  }
  get _musicAssistantEntity() { return this._appleEntity || this._config?.music_assistant_entity; }
  get _state() { return this._hass?.states?.[this._controlEntity]; }

  connectedCallback() { this._ensureDOM(); this._bind(); this._connectFavorites(); this._connectAlarmSongs(); this._loadNativeVolume(); this._renderPlayer(); this._resolveApplePlayer(); }
  disconnectedCallback() {
    clearTimeout(this._progressTimer);this._cancelSeek();
    this._unbind?.(); this._unbind = null;
    this._disconnectFavorites();
    this._disconnectAlarmSongs();
    this._volumeInteracting=false;
    this._nativeVolumeLoader?.remove();
    this._request++;
    this._epoch++;
    this._busy = false;
    this._browseLoading = false;
    this._dialog?.close();
    this._resetApple();
    this._appleResolution=null;
  }

  _ensureDOM() {
    if (this._player) return;
    this.shadowRoot.innerHTML = `<style>${UI_CSS}\n${MUSIC_DIALOG_CSS}\n${MUSIC_CSS}</style><ha-card>
      <main><div id="player" class="music-stack"></div></main></ha-card>
      ${dialog({id:'music-radio-dialog',title:'Radio Browser',content:`<div class="music-browser">
        <form id="music-search-form" class="music-browser">
          <div id="search-field">${field({id:'music-radio-query',label:'Sender suchen',type:'search',placeholder:'z. B. SWR3 oder Rock',maxLength:200,autocomplete:'off'})}</div>
          <div class="toolbar">${button({label:'Suchen',action:'search',variant:'primary'})}${button({label:'Beliebt',action:'popular'})}${button({label:'Deutschland',action:'germany'})}${button({label:'Kategorien',action:'root'})}${button({label:'Favoriten verwalten',action:'manage-favorites'})}</div>
        </form>
        <div id="music-radio-status" aria-live="polite"></div>
        <div id="music-radio-path"></div>
        <div id="music-radio-results" class="music-results" aria-label="Radiosender und Kategorien"></div>
      </div>`})}
      ${dialog({id:'music-apple-dialog',title:'Apple Music',content:`<div class="music-browser">
        <div id="music-apple-account"></div>
        <form id="music-apple-search-form" class="music-browser">
          <div class="music-search-line">${field({id:'music-apple-query',label:'Apple Music durchsuchen',type:'search',placeholder:'Titel, Album oder Playlist',maxLength:200,autocomplete:'off'})}${button({label:'Suchen',action:'apple-search',variant:'primary'})}</div>
          <div class="music-library-nav" aria-label="Mediathek">${button({label:'Playlists',action:'apple-library',data:{view:'playlist'}})}${button({label:'Alben',action:'apple-library',data:{view:'album'}})}${button({label:'Titel',action:'apple-library',data:{view:'track'}})}</div>
          <div class="music-manage-nav">${button({label:'Wecklieder',action:'apple-songs'})}${button({label:'Favoriten verwalten',action:'manage-favorites'})}</div>
        </form>
        <div id="music-alarm-song-tools" hidden>${field({id:'music-alarm-song-query',label:'Wecklieder durchsuchen',type:'search',placeholder:'Lied suchen',maxLength:200,autocomplete:'off'})}${button({label:'Lieder in Apple Music hinzufügen',action:'open-apple'})}</div>
        <div id="music-apple-status" aria-live="polite"></div>
        <div id="music-apple-location"></div>
        <div id="music-apple-results" class="music-results music-apple-results music-browser" aria-label="Apple-Music-Einträge"></div>
        <div id="music-apple-more"></div>
      </div>`})}`;
    this._player = this.shadowRoot.getElementById('player');
    this._dialog = this.shadowRoot.getElementById('music-radio-dialog');
    this._searchInput = this.shadowRoot.getElementById('music-radio-query');
    this._appleDialog=this.shadowRoot.getElementById('music-apple-dialog');
    this._appleQuery=this.shadowRoot.getElementById('music-apple-query');
    this._alarmSongInput=this.shadowRoot.getElementById('music-alarm-song-query');
    this._alarmSongInput.addEventListener('input',()=>{this._alarmSongQuery=this._alarmSongInput.value;this._renderApple();});
    this.shadowRoot.getElementById('music-apple-search-form').addEventListener('submit',event=>{event.preventDefault();void this._action({action:'apple-search'});});
    this._appleDialog.addEventListener('close',()=>{
      this._appleRequest++;this._appleLoading=false;
      const active=this.shadowRoot.activeElement;
      if(!active || this._appleDialog.contains(active))this._player.querySelector('[data-action="open-apple"]')?.focus();
    });
    this.shadowRoot.addEventListener('change',event=>{
      const input=event.target;
      if(!input.matches?.('input[data-managed-favorite-id]') || input.checked || input.disabled)return;
      const station=this._favorites.find(s=>s.media_content_id===input.dataset.managedFavoriteId);
      if(!station)return;
      this._pendingFavoriteFocus={id:station.media_content_id,index:this._favorites.indexOf(station)};
      void this._toggleFavorite(station,false);
    });
    this._searchInput.addEventListener('input',()=>{this._query=this._searchInput.value;});
    this.shadowRoot.getElementById('music-search-form').addEventListener('submit',event=>{event.preventDefault();void this._search();});
    this._dialog.addEventListener('close',()=>{
      this._request++;
      this._browseLoading=false;
      // Restore a removed opener, but do not steal focus if the user has
      // already moved to another control before the native close event arrives.
      const active=this.shadowRoot.activeElement;
      if(!active || this._dialog.contains(active))this._player.querySelector('[data-action="open-radio"]')?.focus();
    });
    this._player.addEventListener('focusout',event=>{
      // A button receiving focus is still between pointerdown and click.
      // Keep it in place when leaving the timeline so its click is delivered.
      if(event.target.id==='music-seek'&&event.relatedTarget?.closest('button')&&this._player.contains(event.relatedTarget))return;
      queueMicrotask(()=>{if(this._deferredPlayer && !this._editingVolume())this._renderPlayer();});
    });
    this.shadowRoot.addEventListener('error',event=>{if(event.target.tagName==='IMG')event.target.hidden=true;},true);
    this._bind();
  }

  _bind() {
    if (this._unbind || !this._player || !this.isConnected) return;
    this._unbind = bindUI(this.shadowRoot,event=>{void this._action(event);});
  }

  _disconnectFavorites() {
    this._favoriteEpoch++;
    this._favoriteUnsubscribe?.();
    this._favoriteUnsubscribe=null;
    this._favoriteUser=null;
    this._favoriteConnection=null;
    this._favoriteBusy=false;
    this._favoriteRemovingId=null;this._pendingFavoriteFocus=null;
    this._favorites=[];
  }

  _connectFavorites() {
    if(!this.isConnected || !this._hass)return;
    const hass=this._hass, user=hass.user?.id, connection=hass.connection;
    if(this._favoriteUser===user && this._favoriteConnection===connection)return;
    this._disconnectFavorites();
    this._favoriteUser=user;
    this._favoriteConnection=connection;
    this._favoriteLoading=Boolean(user);
    this._favoriteError=user?'':'Favoriten benötigen einen angemeldeten Home-Assistant-Benutzer.';
    const epoch=this._favoriteEpoch;
    // Clear the previous user's shortcuts immediately, even during a drag.
    this.shadowRoot.activeElement?.blur?.();
    this._renderPlayer();if(this._dialog.open)this._renderBrowser();
    if(!user)return;
    const apply=response=>{
      if(epoch!==this._favoriteEpoch)return;
      this._favorites=normalizeFavorites(response?.value).filter(f=>!f.alarm_song);
      this._favoriteRevision=(this._favoriteRevision||0)+1;
      this._favoriteLoading=false;this._favoriteError='';
      this._renderPlayer();if(this._dialog.open)this._renderBrowser();if(this._appleDialog.open)this._renderApple();
    };
    void (async()=>{
      try {
        if(connection?.subscribeMessage) {
          const unsubscribe=await connection.subscribeMessage(apply,{type:'frontend/subscribe_user_data',key:FAVORITES_KEY});
          if(epoch!==this._favoriteEpoch)unsubscribe();
          else this._favoriteUnsubscribe=unsubscribe;
        } else apply(await hass.callWS({type:'frontend/get_user_data',key:FAVORITES_KEY}));
      } catch(error) {
        if(epoch!==this._favoriteEpoch)return;
        this._favoriteLoading=false;
        this._favoriteError='Favoriten konnten nicht geladen werden: '+errorText(error);
        this._renderPlayer();if(this._dialog.open)this._renderBrowser();
      }
    })();
  }

  _disconnectAlarmSongs() {
    this._alarmSongEpoch++;this._alarmSongUnsubscribe?.();this._alarmSongUnsubscribe=null;
    this._alarmSongUser=null;this._alarmSongConnection=null;this._alarmSongs=[];
    this._alarmSongLoading=false;this._alarmSongSaving=false;this._alarmSongError='';
  }

  _connectAlarmSongs() {
    if(!this.isConnected||!this._hass)return;
    const hass=this._hass,user=hass.user?.id,connection=hass.connection;
    if(this._alarmSongUser===user&&this._alarmSongConnection===connection)return;
    this._disconnectAlarmSongs();this._alarmSongUser=user;this._alarmSongConnection=connection;
    if(!user)return;
    const epoch=this._alarmSongEpoch;this._alarmSongLoading=true;
    const apply=response=>{
      if(epoch!==this._alarmSongEpoch)return;
      this._alarmSongs=normalizeAlarmSongs(response?.value);this._alarmSongRevision=(this._alarmSongRevision||0)+1;this._alarmSongLoading=false;this._alarmSongError='';this._renderApple();
    };
    void(async()=>{
      try {
        await migrateAlarmSongs(hass);
        if(epoch!==this._alarmSongEpoch)return;
        if(connection?.subscribeMessage){
          const unsubscribe=await connection.subscribeMessage(apply,{type:'frontend/subscribe_user_data',key:ALARM_SONGS_KEY});
          if(epoch!==this._alarmSongEpoch)unsubscribe();else this._alarmSongUnsubscribe=unsubscribe;
        }else apply(await hass.callWS({type:'frontend/get_user_data',key:ALARM_SONGS_KEY}));
      }catch(error){if(epoch===this._alarmSongEpoch){this._alarmSongLoading=false;this._alarmSongError='Wecklieder konnten nicht geladen werden: '+errorText(error);this._renderApple();}}
    })();
  }

  async _toggleFavorite(station,enabled,alarmSong=false) {
    if(this._favoriteBusy || (alarmSong?this._alarmSongLoading:this._favoriteLoading) || !station?.can_play)return;
    const epoch=this._favoriteEpoch, hass=this._hass;
    const revision=alarmSong?this._alarmSongRevision||0:this._favoriteRevision||0;
    const current=(alarmSong?this._alarmSongs:this._favorites).find(s=>s.media_content_id===station.media_content_id);
    enabled??=!current;
    this._favoriteRemovingId=enabled||alarmSong?null:station.media_content_id;
    this._favoriteBusy=true;if(alarmSong){this._alarmSongSaving=true;this._alarmSongError='';}else this._favoriteError='';this._renderBrowser();this._renderApple();
    try {
      const favorites=await (alarmSong?saveAlarmSong:saveFavorite)(hass,station,enabled);
      if(epoch===this._favoriteEpoch&&revision===(alarmSong?this._alarmSongRevision||0:this._favoriteRevision||0)){if(alarmSong)this._alarmSongs=favorites;else this._favorites=favorites.filter(f=>!f.alarm_song);}
    } catch(error) {
      if(epoch===this._favoriteEpoch){if(alarmSong)this._alarmSongError='Wecklieder konnten nicht gespeichert werden: '+errorText(error);else this._favoriteError='Favoriten konnten nicht gespeichert werden: '+errorText(error);}
    } finally {
      if(epoch===this._favoriteEpoch){this._favoriteBusy=false;this._alarmSongSaving=false;this._favoriteRemovingId=null;this._renderPlayer();this._renderBrowser();this._renderApple();}
    }
  }

  async _moveFavorite(id,direction) {
    if(this._favoriteBusy||this._favoriteLoading)return;
    const epoch=this._favoriteEpoch,revision=this._favoriteRevision||0;
    this._favoriteBusy=true;this._favoriteError='';this._renderBrowser();
    try {
      const favorites=await moveFavorite(this._hass,id,direction);
      if(epoch===this._favoriteEpoch&&revision===(this._favoriteRevision||0))this._favorites=favorites.filter(f=>!f.alarm_song);
    } catch(error) {
      if(epoch===this._favoriteEpoch)this._favoriteError='Favoriten konnten nicht sortiert werden: '+errorText(error);
    } finally {
      if(epoch===this._favoriteEpoch){
        this._favoriteBusy=false;this._pendingFavoriteFocus={id,direction};
        this._renderPlayer();this._renderBrowser();
      }
    }
  }

  _editingVolume() {
    const active=this.shadowRoot.activeElement;
    return this._volumeInteracting || this._seekInteracting || this._player?.querySelector('ha-control-slider')?.pressed || Boolean(active && this._player?.contains(active) &&
      (active.type==='range' || active.localName==='ha-control-slider'));
  }

  async _loadNativeVolume() {
    if(!this.isConnected || !this._hass || !this._config?.controls.volume)return;
    if(customElements.get('ha-control-slider')){
      if(this.shadowRoot.getElementById('music-volume')?.localName!=='ha-control-slider')this._renderPlayer();
      return;
    }
    if(this._nativeVolumeRequested || !window.loadCardHelpers)return;
    this._nativeVolumeRequested=true;
    let timer;
    try {
      // Ask HA's own card loader to register its volume feature and slider.
      // The hidden tile only loads frontend code; it sends no player commands.
      const helpers=await window.loadCardHelpers();
      if(!this.isConnected)return;
      if(!customElements.get('ha-control-slider')) {
        const loader=helpers.createCardElement({type:'tile',entity:this._config.entity,features:[{type:'media-player-volume-slider',show_mute_button:false}]});
        loader.hidden=true;loader.setAttribute('aria-hidden','true');loader.hass=this._hass;
        this._nativeVolumeLoader=loader;this.shadowRoot.append(loader);
        await Promise.race([customElements.whenDefined('ha-control-slider'),new Promise(resolve=>{timer=setTimeout(resolve,8000);})]);
      }
      if(this.isConnected)this._renderPlayer();
    } catch {
      // The standard UI Kit range remains fully usable while HA loads.
    } finally {
      clearTimeout(timer);this._nativeVolumeLoader?.remove();this._nativeVolumeLoader=null;
    }
  }

  _volumeMarkup(value,disabled) {
    return customElements.get('ha-control-slider')
      ? `<ha-control-slider id="music-volume" min="0" max="100" step="1" value="${value}" label="Lautstärke" unit="%" show-handle tooltip-mode="interaction"${disabled?' disabled':''}></ha-control-slider>`
      : rangeControl({id:'music-volume',label:'Lautstärke',value,action:'volume',allowKeep:false,disabled});
  }

  _bindNativeVolume(value,disabled) {
    const slider=this.shadowRoot.getElementById('music-volume');
    if(slider?.localName!=='ha-control-slider')return;
    Object.assign(slider,{value,min:0,max:100,step:1,unit:'%',label:'Lautstärke',
      locale:this._hass?.locale,showHandle:true,tooltipMode:'interaction',disabled});
    slider.addEventListener('slider-moved',event=>{
      event.stopPropagation();
      if(slider!==this.shadowRoot.getElementById('music-volume'))return;
      if(Number.isFinite(event.detail?.value))this._volumeInteracting=true;
      else queueMicrotask(()=>{this._volumeInteracting=false;if(this._deferredPlayer&&!this._editingVolume())this._renderPlayer();});
    });
    slider.addEventListener('value-changed',event=>{
      event.stopPropagation();
      if(slider!==this.shadowRoot.getElementById('music-volume'))return;
      this._volumeInteracting=false;
      const value=event.detail?.value;
      if(!slider.disabled && Number.isFinite(value))void this._action({action:'volume',phase:'change',value});
    });
  }

  get _isApplePlayback() { return Boolean(this._musicAssistantEntity && this._controlEntity===this._musicAssistantEntity); }

  _cancelSeek() {
    this._seekInteracting=false;this._seekSnapshot=null;this._seekPending=null;
    if(this.shadowRoot?.activeElement?.id==='music-seek')this.shadowRoot.activeElement.blur();
  }

  _updateProgress(position) {
    const slider=this.shadowRoot.getElementById('music-seek');
    const progress=this._isApplePlayback?playbackProgress(this._state):null;
    if(!slider||!progress)return;
    if(position===undefined&&this._seekInteracting)return;
    const anchor=JSON.stringify([this._state.attributes.media_position,this._state.attributes.media_position_updated_at]);
    if(this._seekPending){
      if(this._seekPending.anchor!==anchor || Date.now()-this._seekPending.at>10000)this._seekPending=null;
      else if(position===undefined)position=this._seekPending.position+(this._state.state==='playing'?(Date.now()-this._seekPending.at)/1000:0);
    }
    const current=Math.max(0,Math.min(progress.duration,position??progress.position));
    slider.value=String(Math.round(current));
    const text=formatTime(current)+' / '+formatTime(progress.duration);
    slider.setAttribute('aria-valuetext',text);
    const control=slider.closest('[data-ui-range]');
    control.querySelector('output').textContent=text;
    slider.style.setProperty('--range-percent',String(current/progress.duration*100)+'%');
  }

  _scheduleProgress() {
    clearTimeout(this._progressTimer);
    if(!this.isConnected||!this._isApplePlayback||this._state?.state!=='playing'||!playbackProgress(this._state))return;
    this._progressTimer=setTimeout(()=>{this._updateProgress();this._scheduleProgress();},1000);
  }

  async _seek(value,phase) {
    if(!this._isApplePlayback||!hasFeature(this._state,'seek')||!Number.isFinite(value))return;
    const progress=playbackProgress(this._state);
    if(!progress||this._busy)return;
    const current={entity:this._controlEntity,track:mediaIdentity(this._state),epoch:this._epoch};
    this._seekSnapshot ||= current;
    if(phase==='input'){this._seekInteracting=true;this._updateProgress(value);return;}
    if(phase!=='change')return;
    const captured=this._seekSnapshot;
    this._seekSnapshot=null;this._seekInteracting=false;
    if(Object.keys(current).some(key=>current[key]!==captured[key]))return;
    const position=Math.round(Math.max(0,Math.min(progress.duration,value)));
    this._seekPending={position,at:Date.now(),anchor:JSON.stringify([this._state.attributes.media_position,this._state.attributes.media_position_updated_at])};
    const ok=await this._service('media_seek',{seek_position:position},undefined,current.entity);
    if(this._epoch!==current.epoch||mediaIdentity(this._state)!==current.track)return;
    if(!ok)this._seekPending=null;
    this._updateProgress(ok?position:undefined);
    const status=this.shadowRoot.getElementById('music-player-status');
    if(status)status.innerHTML=this._error?notice(this._error,{error:true}):'';
  }

  _renderPlayer() {
    if (!this._player || !this._config) return;
    // HA state updates must not replace an input while the user drags it.
    const active = this.shadowRoot.activeElement;
    if (this._editingVolume()) { this._deferredPlayer=true;return; }
    this._deferredPlayer=false;
    const focusedAction = this._player.contains(active) ? active?.dataset?.action : null;
    const state=this._state, attrs=state?.attributes || {}, controls=this._config.controls;
    const available=isAvailable(state), disabled=!available || this._busy;
    const action=playbackAction(state,this._selectedStation);
    const playing=['playing','buffering'].includes(state?.state);
    const playbackLabel=playing ? 'Pause' : 'Play';
    const stateLabel={playing:'Wiedergabe',paused:'Pausiert',idle:'Bereit',off:'Aus',buffering:'Wird geladen',unavailable:'Nicht erreichbar',unknown:'Status unbekannt'}[state?.state] || 'Nicht gefunden';
    const apple=this._isApplePlayback,progress=apple?playbackProgress(state):null;
    const selectedRadio=!apple && this._playbackSource==='radio' && this._selectedStation;
    const radio=!apple && (selectedRadio || sonosPlaybackSource(state)==='radio');
    // A title/artist refresh is not confirmation of a new radio station.
    // Pin the chosen station until its own channel metadata arrives.
    const title=selectedRadio?this._selectedStation.title:radio?(attrs.media_channel || attrs.media_title || 'Radio'):(attrs.media_title || attrs.media_channel || 'Keine Wiedergabe');
    const radioFresh=!selectedRadio || attrs.media_channel===this._selectedStation.title;
    const detail=radio?['Radio',radioFresh&&attrs.media_title!==title&&attrs.media_title!==this._radioPreviousTitle?attrs.media_title:'',stateLabel].filter(Boolean).join(' · '):[attrs.media_artist || attrs.media_album_name, attrs.media_channel && attrs.media_channel!==title ? attrs.media_channel : '', stateLabel].filter(Boolean).join(' · ');
    const transport=[];
    if (controls.previous) transport.push(musicButton({label:'Zurück',icon:'previous',action:'previous',disabled:disabled||!hasFeature(state,'previous')}));
    if (controls.play_pause) transport.push(musicButton({label:playbackLabel,icon:playing?'pause':'play',action:'play-pause',disabled:disabled||!action}));
    if (controls.next) transport.push(musicButton({label:'Weiter',icon:'next',action:'next',disabled:disabled||!hasFeature(state,'next')}));
    if (apple&&controls.shuffle&&hasFeature(state,'shuffle'))transport.push(musicButton({label:attrs.shuffle?'Shuffle ausschalten':'Shuffle einschalten',icon:'shuffle',action:'shuffle',disabled,pressed:Boolean(attrs.shuffle)}));
    const vol=attrs.is_volume_muted?0:volumePercent(attrs.volume_level);
    this._player.innerHTML = `
      <div class="music-header">
        <div class="music-now-playing"><h2 class="music-title">${escapeHtml(title)}</h2><div class="music-detail">${escapeHtml(detail)}</div></div>
        <div class="music-box" aria-label="Box">${escapeHtml(this._hass?.states?.[this._config.entity]?.attributes?.friendly_name || this._config.entity)}</div>
      </div>
      ${!state ? notice('Die konfigurierte Sonos-Box wurde nicht gefunden. Bitte prüfe die Entität im Karteneditor.',{error:true}) : !available ? notice('Die Sonos-Box ist momentan nicht erreichbar.') : ''}
      <div class="music-controls">
        ${transport.length ? `<div class="music-transport" aria-label="Wiedergabe">${transport.join('')}</div>` : ''}
        ${apple?`<div class="music-apple-playback">
          ${progress?rangeControl({id:'music-seek',label:'Titelposition',value:Math.round(progress.position),min:0,max:progress.duration,step:1,unit:'',action:'seek',allowKeep:false,disabled:disabled||!hasFeature(state,'seek')}):''}
        </div>`:''}
        ${controls.volume ? `<div class="music-volume">${this._volumeMarkup(vol??0,disabled||vol===null||!hasFeature(state,'volume'))}</div>` : ''}
      </div>
      <div id="music-favorites" class="music-favorites" aria-label="Persönliche Favoriten">${this._favorites.map((station,index)=>button({label:station.title,action:'play-favorite',data:{index},disabled:this._busy||(station.kind!=='apple_music'&&(!isAvailable(this._hass?.states?.[this._config.entity])||!hasFeature(this._hass?.states?.[this._config.entity],'playMedia')))}).replace('class=""','class="music-favorite"').replace('<button ',`<button aria-label="${escapeHtml(station.title+' abspielen')}" `).replace('<span>',logoMarkup(station)+'<span>')).join('')}</div>
      <div class="toolbar music-source-actions">${button({label:'Sender wählen',action:'open-radio',disabled:this._busy})}${button({label:'Apple Music',action:'open-apple',disabled:this._busy})}${button({label:'Favoriten',action:'manage-favorites',disabled:this._busy})}${button({label:'Wecklieder',action:'open-alarm-songs',disabled:this._busy})}</div>
      <div id="music-favorite-status" aria-live="polite">${this._favoriteError?notice(this._favoriteError,{error:true})+button({label:'Favoriten neu laden',action:'reload-favorites'}):this._favoriteLoading?loadingState('Favoriten werden geladen …'):!this._favorites.length?notice('Sender, Titel, Alben und Playlists über den Stern zu deinen Favoriten hinzufügen.'):''}</div>
      <div id="music-player-status" aria-live="polite">${this._error ? notice(this._error,{error:true}) : this._busy ? loadingState(this._pendingService==='media_next_track'?'Nächster Titel wird geladen …':'Befehl wird gesendet …') : ''}</div>`;
    this._bindNativeVolume(vol??0,disabled||vol===null||!hasFeature(state,'volume'));
    this._updateProgress();this._scheduleProgress();
    // The shared range initializes after DOM replacement; then restore the
    // timeline's clock formatting without changing the shared component.
    queueMicrotask(()=>this._updateProgress(this._seekInteracting?Number(this.shadowRoot.getElementById('music-seek')?.value):undefined));
    if (focusedAction) this._player.querySelector(`[data-action="${focusedAction}"]`)?.focus();
  }

  async _action({action,data,value,phase,checked}) {
    switch(action) {
      case 'seek': await this._seek(value,phase);break;
      case 'shuffle': if(this._isApplePlayback&&hasFeature(this._state,'shuffle'))await this._service('shuffle_set',{shuffle:!Boolean(this._state.attributes?.shuffle)});break;
      case 'open-apple': await this._openApple();break;
      case 'open-alarm-songs': this._openAlarmSongs();break;
      case 'apple-search': this._appleContainer=null;this._appleParent=null;this._appleOwnSongs=false;await this._loadApple('search');break;
      case 'apple-library': this._appleContainer=null;this._appleParent=null;this._appleOwnSongs=false;this._appleView=data.view;await this._loadApple('library');break;
      case 'apple-more': await this._loadApple(this._appleContainer?'tracks':'library',true);break;
      case 'apple-tracks': await this._showAppleTracks(this._appleItems[Number(data.index)]);break;
      case 'favorite-tracks': await this._showAppleTracks(this._favorites.find(f=>f.uri===data.id));break;
      case 'apple-back': this._restoreAppleParent();break;
      case 'apple-retry': if(this._appleRetry)await this._loadApple(this._appleRetry.action,this._appleRetry.append);break;
      case 'apple-songs': this._showAlarmSongs();break;
      case 'remove-alarm-song': {
        const song=this._alarmSongs.find(s=>s.uri===data.uri),epoch=this._epoch;
        if(song)await this._toggleFavorite(song,false,true);
        if(epoch===this._epoch&&this._appleDialog.open)this._appleDialog.querySelector('[data-action="remove-alarm-song"]')?.focus();
        break;
      }
      case 'reload-alarm-songs': this._disconnectAlarmSongs();this._connectAlarmSongs();this._renderApple();break;
      case 'apple-play': await this._playApple(this._appleItems[Number(data.index)]);break;
      case 'apple-favorite': {const item=appleFavorite(this._appleItems[Number(data.index)]);if(item)await this._toggleFavorite(item);break;}
      case 'apple-alarm-song': {const item=appleFavorite(this._appleItems[Number(data.index)]);if(item?.media_type==='track')await this._toggleFavorite(item,undefined,true);break;}
      case 'move-favorite': await this._moveFavorite(data.program,data.direction);break;
      case 'manage-favorites':
        this._appleDialog.close();this._request++;this._browseLoading=false;this._favoriteMode=true;this._radioError='';this._error='';
        if(!this._dialog.open)this._dialog.showModal();this._renderBrowser();break;
      case 'reload-favorites': this._disconnectFavorites();this._connectFavorites();break;
      case 'toggle-favorite': await this._toggleFavorite(this._browserItems[Number(data.index)]);break;
      case 'play-favorite': {const station=this._favorites[Number(data.index)];if(station?.kind==='apple_music')await this._playApple(station);else if(station)await this._playStation(station);break;}
      case 'open-radio': await this._openRadio();break;
      case 'search': await this._search();break;
      case 'root': await this._browse(RADIO_ROOT,'Kategorien',true);break;
      case 'popular': await this._browse(RADIO_ROOT+'/popular','Beliebte Sender',true);break;
      case 'germany': await this._browse(RADIO_ROOT+'/country/DE','Deutschland',true);break;
      case 'back': {
        const path=this._path.slice(0,-1), parent=path.at(-1);
        await this._browse(parent?.id||RADIO_ROOT,parent?.title||'Kategorien',false,path);break;
      }
      case 'browse-item': {
        const item=this._browserItems[Number(data.index)];
        if(item?.can_expand)await this._browse(item.media_content_id,this._translateCategory(item.title));break;
      }
      case 'play-station': {
        const station=this._browserItems[Number(data.index)];
        if(station?.can_play)await this._playStation(station);break;
      }
      case 'stop': if(hasFeature(this._state,'stop'))await this._service('media_stop');break;
      case 'previous': if(hasFeature(this._state,'previous'))await this._service('media_previous_track');break;
      case 'next': if(hasFeature(this._state,'next'))await this._service('media_next_track');break;
      case 'play-pause': {
        const service=playbackAction(this._state,this._selectedStation);
        if(service==='play_media')await this._playStation(this._selectedStation);
        else if(service)await this._service(service);break;
      }
      case 'volume':
        if (phase==='change' && hasFeature(this._state,'volume') && Number.isFinite(value)) {
          const level=Math.max(0,Math.min(100,value))/100;
          const epoch=this._epoch;
          const ok=await this._service('volume_set',{volume_level:level});
          // A positive slider value must also release mute set in another app.
          if(ok && epoch===this._epoch && level>0 && this._state?.attributes?.is_volume_muted && hasFeature(this._state,'mute'))await this._service('volume_mute',{is_volume_muted:false});
          // Preserve the focused slider, then reflect a rejected command on blur.
          this._deferredPlayer=true;
          const status=this.shadowRoot.getElementById('music-player-status');
          if(status)status.innerHTML=this._error?notice(this._error,{error:true}):'';
        }
        break;
    }
  }

  async _service(service,payload={},onSuccess,entityOverride) {
    if(this._busy || !this._hass || !isAvailable(this._state))return false;
    const epoch=this._epoch, hass=this._hass, entity=entityOverride||this._controlEntity;
    this._busy=true;this._pendingService=service;this._error='';this._renderPlayer();
    if(this._dialog.open)this._renderBrowser();
    try {
      if(service==='media_next_track'&&entity===this._musicAssistantEntity)await this._appleCommand('next');
      else await hass.callService('media_player',service,{...payload,entity_id:entity});
      if(epoch!==this._epoch)return false;
      onSuccess?.();
      return true;
    } catch(error) {
      if(epoch===this._epoch)this._error='Befehl fehlgeschlagen: '+errorText(error);
      return false;
    } finally {
      if(epoch===this._epoch) {
        this._busy=false;this._pendingService=null;this._renderPlayer();
        if(this._dialog.open)this._renderBrowser();
      }
    }
  }

  async _playStation(station) {
    if(!hasFeature(this._hass?.states?.[this._config.entity],'playMedia'))return;
    let payload;
    try {payload=stationPayload(station);} catch(error) {this._radioError=errorText(error);this._renderBrowser();return;}
    const previousNative=this._hass?.states?.[this._config.entity],previousId=sonosContentId(previousNative),previousTitle=previousNative?.attributes?.media_title;
    await this._service('play_media',payload,()=>{
      this._playbackSource='radio';this._radioPreviousTitle=previousTitle;this._radioContentId=null;this._playbackIntent={source:'radio',previousId};this._cancelSeek();
      this._selectedStation={...station};
      this._applePreferred=false;this._syncRadioStation();
      this._dialog.close();
    },this._config.entity);
  }

  _resetApple(close=true) {
    this._appleRequest++;this._appleItems=[];this._appleAccount='';this._appleError='';
    this._appleLoading=false;this._appleMore=false;this._applePreferred=false;this._appleEntity='';this._appleReady=false;
    this._appleContainer=null;this._appleParent=null;this._appleOwnSongs=false;this._appleRetry=null;
    this._alarmSongQuery='';if(this._alarmSongInput)this._alarmSongInput.value='';
    if(close)this._appleDialog?.close();
    if(this._appleQuery)this._appleQuery.value='';
    this._renderApple();
  }

  async _appleCommand(action,data={}) {
    const response=await this._hass.callWS({type:'music_manager/apple_music',action,
      ...(this._config.music_assistant_entity?{entity_id:this._config.music_assistant_entity}:{}),
      source_entity:this._config.entity,...data});
    // Access Control can replace a successful result with null when its
    // entity_id is hidden. Keep that boundary intact and explain the missing
    // response instead of dereferencing it or falling back to another player.
    if(!response || typeof response!=='object' || Array.isArray(response)
      || (action==='status' && !/^media_player\.[a-z0-9_]+$/.test(response.entity_id||''))
      || (['library','search','tracks'].includes(action) && !Array.isArray(response.items))) {
      throw {code:'apple_response_unavailable',message:'Die Apple-Music-Antwort ist leer oder unvollständig. Bitte als Administrator die Zugriffsrechte für die Sonos-Entität und die zusätzliche Music-Assistant-Entität dieser Box prüfen. In Access Control müssen beide zum Anzeigen und Bedienen freigegeben sein, beispielsweise über dasselbe Label.'};
    }
    return response;
  }

  _resolveApplePlayer() {
    if(!this.isConnected || !this._hass || !this._config)return;
    const key={epoch:this._epoch,connection:this._hass.connection,user:this._hass.user?.id};
    if(this._appleResolution && Object.keys(key).every(k=>this._appleResolution[k]===key[k]))return;
    this._appleResolution=key;
    // Restore queue controls after a reload, before opening the music picker.
    // Setup errors are shown when opening Apple Music; radio remains usable.
    Promise.resolve(this._appleCommand('status')).then(status=>{
      if(this._appleResolution!==key || this._epoch!==key.epoch)return;
      if(status.entity_id){this._appleEntity=status.entity_id;this._renderPlayer();}
    }).catch(()=>{});
  }

  _appleFailure(error) {
    return ['unknown_command','not_found'].includes(error?.code)
      ? 'Der Music-Manager-Connector ist noch nicht eingerichtet. Installiere Music Manager im Marketplace mit Typ Integration. '+APPLE_SETUP
      : 'Apple Music: '+errorText(error);
  }

  async _openApple() {
    this._resetApple(false);
    if(!this._appleDialog.open)this._appleDialog.showModal();
    const request=++this._appleRequest;
    this._appleLoading=true;this._renderApple();
    try {
      const status=await this._appleCommand('status');
      if(request!==this._appleRequest)return;
      this._appleEntity=status.entity_id||this._config.music_assistant_entity||'';
      this._appleAccount=status.account||'Dein Konto';
      this._appleReady=true;
      this._renderPlayer();
      this._appleView='playlist';
      await this._loadApple('library');
      if(this._appleDialog.open&&window.matchMedia?.('(pointer:fine)').matches)this._appleQuery.focus();
    } catch(error) {
      if(request!==this._appleRequest)return;
      this._appleError=this._appleFailure(error);this._appleLoading=false;this._renderApple();
    }
  }

  async _loadApple(action,append=false) {
    if(this._busy || !this._musicAssistantEntity)return;
    const query=this._appleQuery.value.trim().slice(0,200);
    if(action==='search'&&!query){this._appleError='Bitte einen Suchbegriff eingeben.';this._renderApple();return;}
    const request=++this._appleRequest;
    this._appleLoading=true;this._appleError='';this._appleSearch=action==='search';
    this._appleRetry=null;
    const offset=append?this._appleOffset||0:0;
    if(!append)this._appleItems=[];
    this._appleMore=false;this._renderApple();
    try {
      const response=await this._appleCommand(action,action==='search'?{query}:action==='tracks'?{uri:this._appleContainer.uri,offset}:{media_type:this._appleView,offset});
      if(request!==this._appleRequest)return;
      const items=response.items.filter(item=>item && typeof item.uri==='string'&&typeof item.title==='string');
      this._appleItems=append?[...this._appleItems,...items]:items;
      this._appleMore=Boolean(response.more);this._appleOffset=response.next_offset;
    } catch(error) {
      if(request!==this._appleRequest)return;
      this._appleError=this._appleFailure(error);
      this._appleRetry={action,append};
    } finally {
      if(request===this._appleRequest){this._appleLoading=false;this._renderApple();}
    }
  }

  _rememberAppleParent() {
    this._appleParent={epoch:this._epoch,items:[...this._appleItems],view:this._appleView,search:this._appleSearch,
      query:this._appleQuery.value,more:this._appleMore,offset:this._appleOffset,container:this._appleContainer,ownSongs:this._appleOwnSongs,parent:this._appleParent,scroll:this.shadowRoot.getElementById('music-apple-results').scrollTop};
  }

  async _showAppleTracks(item) {
    if(!item||!['album','playlist'].includes(item.media_type)||this._busy||this._appleLoading)return;
    const epoch=this._epoch;
    if(!this._appleDialog.open){this._dialog.close();await this._openApple();}
    if(epoch!==this._epoch||!this._appleReady||!this._appleDialog.open)return;
    this._rememberAppleParent();this._appleContainer={uri:item.uri,title:item.title,media_type:item.media_type};this._appleOwnSongs=false;
    await this._loadApple('tracks');
    if(epoch===this._epoch&&this._appleContainer?.uri===item.uri)this.shadowRoot.getElementById('music-apple-results').scrollTop=0;
  }

  _showAlarmSongs() {
    if(this._busy||this._appleLoading||this._appleOwnSongs)return;
    this._rememberAppleParent();this._appleRequest++;this._appleContainer=null;this._appleOwnSongs=true;
    this._appleLoading=false;this._appleMore=false;this._appleError='';this._appleRetry=null;this._renderApple();
  }

  _openAlarmSongs() {
    this._resetApple(false);this._dialog.close();this._appleOwnSongs=true;
    if(!this._appleDialog.open)this._appleDialog.showModal();this._renderApple();
  }

  _restoreAppleParent() {
    const parent=this._appleParent;if(!parent||parent.epoch!==this._epoch||this._busy)return;
    this._appleRequest++;this._appleLoading=false;this._appleContainer=parent.container;this._appleOwnSongs=parent.ownSongs;this._appleParent=parent.parent;this._appleError='';this._appleRetry=null;
    this._appleItems=parent.items;this._appleView=parent.view;this._appleSearch=parent.search;this._appleQuery.value=parent.query;this._appleMore=parent.more;this._appleOffset=parent.offset;
    this._renderApple();this.shadowRoot.getElementById('music-apple-results').scrollTop=parent.scroll;
  }

  async _playApple(item) {
    if(this._busy||this._appleLoading||!item)return;
    const epoch=this._epoch,previousId=sonosContentId(this._hass?.states?.[this._config.entity]);
    this._busy=true;this._appleError='';this._error='';this._renderApple();this._renderPlayer();
    try {
      if(!this._musicAssistantEntity){
        const status=await this._appleCommand('status');
        if(epoch!==this._epoch)return;
        this._appleEntity=status.entity_id||'';
      }
      await this._appleCommand('play',{uri:item.uri});
      if(epoch!==this._epoch)return;
      this._playbackSource='apple';this._radioContentId=null;this._playbackIntent={source:'apple',previousId,until:Date.now()+15000};this._cancelSeek();
      this._applePreferred=true;this._selectedStation=null;this._appleDialog.close();
    } catch(error) {
      if(epoch===this._epoch){this._appleError=this._appleFailure(error);if(!this._appleDialog.open)this._error=this._appleError;}
    } finally {
      if(epoch===this._epoch){this._busy=false;this._renderApple();this._renderPlayer();}
    }
  }

  _renderApple() {
    if(!this._appleDialog)return;
    const configured=Boolean(this._appleReady&&this._musicAssistantEntity), disabled=this._busy||this._appleLoading||!configured;
    this.shadowRoot.getElementById('music-apple-dialog-title').textContent=this._appleOwnSongs?'Wecklieder verwalten':'Apple Music';
    this.shadowRoot.getElementById('music-apple-search-form').hidden=Boolean(this._appleOwnSongs);
    this.shadowRoot.getElementById('music-alarm-song-tools').hidden=!this._appleOwnSongs;
    for(const control of this._appleDialog.querySelectorAll('form button,form input'))control.disabled=disabled;
    for(const control of this._appleDialog.querySelectorAll('[data-action="apple-library"]'))control.setAttribute('aria-pressed',String(!this._appleContainer&&!this._appleOwnSongs&&!this._appleSearch&&control.dataset.view===this._appleView));
    this.shadowRoot.getElementById('music-apple-account').innerHTML=this._appleAccount&&!this._appleOwnSongs?row({title:this._appleAccount,description:'Dein Apple-Music-Konto'}):'';
    this.shadowRoot.getElementById('music-apple-status').innerHTML=(this._appleError?notice(this._appleError,{error:true})+(this._appleRetry?button({label:'Erneut laden',action:'apple-retry',disabled:this._appleLoading}):''):'')+(this._favoriteError?notice(this._favoriteError,{error:true}):'')+(this._alarmSongError?notice(this._alarmSongError,{error:true})+button({label:'Wecklieder erneut laden',action:'reload-alarm-songs'}):'')+(this._appleLoading?loadingState('Apple Music wird geladen …'):this._busy?loadingState('Wiedergabe wird gestartet …'):this._favoriteBusy?loadingState(this._alarmSongSaving?'Wecklieder werden gespeichert …':'Favoriten werden gespeichert …'):this._appleOwnSongs&&this._alarmSongLoading?loadingState('Wecklieder werden geladen …'):'');
    this.shadowRoot.getElementById('music-apple-location').innerHTML=this._appleOwnSongs?row({title:`${this._alarmSongs.length} Wecklieder`,description:'Entfernen ändert die Auswahlliste. Bereits gespeicherte Weckerauswahlen bleiben erhalten.',trailing:this._appleParent?button({label:'Zurück',action:'apple-back',disabled:this._busy}):''}):this._appleParent?row({title:this._appleContainer?.title||'',description:'Einzelne Titel zum Abspielen oder als Wecklied auswählen',trailing:button({label:'Zurück',action:'apple-back',disabled:this._busy})}):'';
    const results=this.shadowRoot.getElementById('music-apple-results');
    if(this._appleOwnSongs){const query=(this._alarmSongQuery||'').trim().toLocaleLowerCase();this._appleItems=this._alarmSongs.filter(s=>[s.title,s.description].join(' ').toLocaleLowerCase().includes(query));}
    results.setAttribute('aria-label',this._appleOwnSongs?'Wecklieder verwalten':'Apple-Music-Einträge');
    results.setAttribute('aria-busy',String(this._appleLoading||this._appleOwnSongs&&this._alarmSongLoading));
    results.innerHTML=this._appleItems.map((item,index)=>{
      if(this._appleOwnSongs)return `<div class="music-catalog-item"><div class="music-station-row">${logoMarkup(item)}${row({title:item.title,description:item.description||'Wecklied'})}</div><div class="toolbar music-song-actions">${button({label:'Abspielen',action:'apple-play',data:{index},disabled})}${button({label:'Entfernen',action:'remove-alarm-song',icon:'trash',variant:'danger',data:{uri:item.uri},disabled:this._favoriteBusy||this._alarmSongLoading||!this._hass?.user?.id}).replace('<button ',`<button aria-label="${escapeHtml('Wecklied entfernen: '+item.title)}" `)}</div></div>`;
      const favorite=appleFavorite(item),record=favorite&&this._favorites.find(f=>f.media_content_id===favorite.media_content_id),saved=Boolean(record),alarmSaved=this._alarmSongs.some(s=>s.uri===item.uri);
      const star=favorite?musicButton({label:(saved?'Favorit entfernen: ':'Als Favorit speichern: ')+item.title,icon:'star',action:'apple-favorite',data:{index},pressed:Boolean(saved),disabled:disabled||this._favoriteBusy||this._favoriteLoading||!this._hass?.user?.id}):'';
      const alarm=favorite?.media_type==='track'?musicButton({label:(alarmSaved?'Nicht mehr als Wecklied verwenden: ':'Als Wecklied markieren: ')+item.title,icon:alarmSaved?'alarmFilled':'alarm',action:'apple-alarm-song',data:{index},pressed:alarmSaved,disabled:disabled||this._favoriteBusy||this._alarmSongLoading||!this._hass?.user?.id}):'';
      const open=['album','playlist'].includes(item.media_type)?button({label:'Titel anzeigen',action:'apple-tracks',data:{index},disabled}):'';
      return `<div class="music-catalog-item"><div class="music-station-row">${favorite?logoMarkup(favorite):''}${row({title:item.title,description:[item.description,alarmSaved?'Wecklied':''].filter(Boolean).join(' · ')})}</div><div class="music-result-actions${open?' is-container':''}">${star}${alarm}${open}${button({label:'Abspielen',action:'apple-play',data:{index},disabled})}</div></div>`;
    }).join('')||(!this._appleLoading&&!this._appleError&&!(this._appleOwnSongs&&(this._alarmSongLoading||this._alarmSongError))?emptyState(this._appleOwnSongs?(this._alarmSongQuery?'Keine passenden Wecklieder.':'Noch keine Wecklieder. Öffne ein Album oder eine Playlist und markiere einzelne Titel über das Weckersymbol.'):this._appleContainer?'Dieses Album oder diese Playlist enthält keine verfügbaren Titel.':this._appleSearch?'Keine passenden Einträge gefunden.':'Keine Einträge. Du kannst Apple Music durchsuchen oder eine andere Mediathekansicht öffnen.'):'');
    this.shadowRoot.getElementById('music-apple-more').innerHTML=this._appleMore?button({label:'Mehr laden',action:'apple-more',disabled}):'';
  }

  async _openRadio() {
    this._favoriteMode=false;
    if(!this._dialog.open)this._dialog.showModal();
    this._error='';this._radioError='';
    if(!this._browseReady&&!this._favoriteMode)await this._browse(RADIO_ROOT,'Kategorien',true);
    else this._renderBrowser();
    if(this._dialog.open&&!this._favoriteMode)this._searchInput.focus();
  }

  async _browse(id,title,reset=false,explicitPath) {
    if(!this._hass || !isRadioId(id))return;
    this._favoriteMode=false;this._pendingFavoriteFocus=null;
    const token=++this._request;
    this._browseLoading=true;this._radioError='';this._error='';
    this._query='';this._searchInput.value='';
    this._renderBrowser();
    try {
      const response=await this._hass.callWS({type:'media_source/browse_media',media_content_id:id});
      if(token!==this._request)return;
      this._browserItems=normalizeMedia(response.children);
      this._browseReady=true;
      this._searchMode=false;
      if(id===RADIO_ROOT)this._canSearch=Boolean(response.can_search);
      this._path=explicitPath ?? (reset ? [{id,title}] : [...this._path,{id,title}]);
    } catch(error) {
      if(token!==this._request)return;
      this._browserItems=[];
      this._radioError='Radio Browser konnte nicht geladen werden. Prüfe unter Einstellungen → Geräte & Dienste, ob Radio Browser eingerichtet und verfügbar ist. '+errorText(error);
    } finally {
      if(token===this._request){this._browseLoading=false;this._renderBrowser();}
    }
  }

  async _search() {
    const query=this._searchInput.value.trim().slice(0,200);
    this._query=query;
    if(!query){await this._browse(RADIO_ROOT,'Kategorien',true);return;}
    this._favoriteMode=false;this._pendingFavoriteFocus=null;
    const token=++this._request;
    this._browseLoading=true;this._radioError='';this._error='';this._renderBrowser();
    try {
      if(!this._canSearch)throw new Error('Die globale Sendersuche benötigt Home Assistant 2026.11 oder neuer. Du kannst Sender über die Kategorien auswählen.');
      const response=await this._hass.callWS({type:'media_source/search_media',media_content_id:RADIO_ROOT,search_query:query});
      if(token!==this._request)return;
      this._browserItems=normalizeMedia(response.result);
      this._searchMode=true;
      this._resultQuery=query;
    } catch(error) {
      if(token!==this._request)return;
      this._browserItems=[];
      this._radioError='Sendersuche fehlgeschlagen: '+errorText(error);
    } finally {
      if(token===this._request){this._browseLoading=false;this._renderBrowser();}
    }
  }

  _translateCategory(title) {
    return {'Popular':'Beliebte Sender','By Category':'Genres und Themen','By Language':'Sprachen','Local stations':'Sender in der Nähe','Country list':'Länder','Radio Browser':'Kategorien'}[title] || title;
  }

  _renderBrowser() {
    if(!this._dialog)return;
    const status=this.shadowRoot.getElementById('music-radio-status');
    const results=this.shadowRoot.getElementById('music-radio-results');
    const path=this.shadowRoot.getElementById('music-radio-path');
    const manager=this._favoriteMode;
    this.shadowRoot.getElementById('music-search-form').hidden=manager;
    this.shadowRoot.getElementById('music-radio-dialog-title').textContent=manager?'Favoriten verwalten':'Radio Browser';
    this.shadowRoot.getElementById('search-field').hidden=manager;
    this._dialog.querySelector('[data-action="search"]').hidden=manager;
    this._dialog.querySelector('[data-action="manage-favorites"]').setAttribute('aria-pressed',String(manager));
    for(const control of this._dialog.querySelectorAll('form button'))control.disabled=this._busy;
    this._searchInput.disabled=this._busy||manager;
    status.innerHTML=(this._favoriteError?notice(this._favoriteError,{error:true})+button({label:'Favoriten neu laden',action:'reload-favorites'}):'')+(this._radioError?notice(this._radioError,{error:true}):'')+(this._error?notice(this._error,{error:true}):'')+(manager&&this._favoriteLoading?loadingState('Favoriten werden geladen …'):this._favoriteBusy?loadingState('Favoriten werden gespeichert …'):this._browseLoading?loadingState('Radiosender werden geladen …'):this._busy?loadingState('Sender wird gestartet …'):'');
    results.setAttribute('aria-label',manager?'Favoriten verwalten':'Radiosender und Kategorien');
    results.classList.toggle('music-browser',manager);
    if(manager) {
      path.innerHTML=row({title:`${this._favorites.length} Favoriten`,description:'Mit den Pfeilen sortieren. Häkchen entfernen, um einen Favoriten aus der Kurzwahl zu entfernen.'});
      results.setAttribute('aria-busy',String(this._favoriteBusy||this._favoriteLoading));
      results.innerHTML=this._favoriteLoading?'':this._favorites.length?this._favorites.map((item,index)=>`<div class="music-browser"><div class="music-station-row">${logoMarkup(item)}${row({
        title:item.title,description:item.kind==='apple_music'?(item.media_type==='track'?'Titel':item.media_type==='album'?'Album':'Playlist'):'Radiosender'
      })}</div><div class="music-favorite-actions">${['album','playlist'].includes(item.media_type)?button({label:'Titel anzeigen',action:'favorite-tracks',data:{id:item.uri},disabled:this._favoriteBusy||this._busy}):''}${programOrderButtons({programId:item.media_content_id,index,count:this._favorites.length,action:'move-favorite',desktopOnly:false,disabled:this._favoriteBusy||!this._hass?.user?.id,upLabel:'Nach oben: '+item.title,downLabel:'Nach unten: '+item.title})}<label class="check"><input type="checkbox" data-managed-favorite-id="${escapeHtml(item.media_content_id)}" aria-label="${escapeHtml('Favorit behalten: '+item.title)}"${this._favoriteRemovingId===item.media_content_id?'':' checked'}${this._favoriteBusy||!this._hass?.user?.id?' disabled':''}><span class="visually-hidden">${escapeHtml(item.title)}</span></label></div></div>`).join(''):emptyState('Keine Favoriten vorhanden. Über den Stern bei Sendern, Titeln, Alben oder Playlists kannst du Favoriten hinzufügen.');
      if(this._pendingFavoriteFocus&&!this._favoriteBusy) {
        const {id,index=0,direction}=this._pendingFavoriteFocus,inputs=[...results.querySelectorAll('input[data-managed-favorite-id]')];
        const moved=direction&&[...results.querySelectorAll('[data-action="move-favorite"]')].find(b=>!b.disabled&&b.dataset.program===id&&b.dataset.direction===direction);
        (moved||inputs.find(input=>input.dataset.managedFavoriteId===id)||inputs[Math.min(index,inputs.length-1)]||this._dialog.querySelector('[data-action="manage-favorites"]')).focus();
        this._pendingFavoriteFocus=null;
      }
      return;
    }
    const pathLabel=this._searchMode ? `Suchergebnisse: ${this._resultQuery}` : this._path.map(p=>p.title).join(' / ');
    path.innerHTML=row({title:pathLabel||'Radio Browser',description:this._browseLoading?'':`${this._browserItems.length} Einträge`,trailing:this._path.length>1||this._searchMode?iconButton({icon:'left',label:'Zurück zu den Kategorien',action:'back',disabled:this._busy}):''});
    results.setAttribute('aria-busy',String(this._browseLoading));
    results.innerHTML=this._browseLoading?'':this._browserItems.length?this._browserItems.map((item,index)=>{
      if(item.can_expand)return row({title:this._translateCategory(item.title),description:'Kategorie',trailing:iconButton({icon:'right',label:'Kategorie öffnen: '+item.title,action:'browse-item',data:{index},disabled:this._busy})});
      const saved=this._favorites.some(s=>s.media_content_id===item.media_content_id);
      return `<div class="music-catalog-item"><div class="music-station-row">${logoMarkup(item)}${row({title:item.title,description:'Radiosender'})}</div><div class="music-result-actions is-radio">${musicButton({label:(saved?'Favorit entfernen: ':'Als Favorit speichern: ')+item.title,icon:'star',action:'toggle-favorite',data:{index},pressed:saved,disabled:this._favoriteBusy||this._favoriteLoading||!this._hass?.user?.id})}${button({label:'Abspielen',action:'play-station',data:{index},disabled:this._busy||!isAvailable(this._state)||!hasFeature(this._state,'playMedia')})}</div></div>`;
    }).join(''):this._radioError?'':emptyState(this._searchMode?'Keine passenden Sender gefunden. Versuche einen anderen Namen.':'Keine Einträge in dieser Kategorie.');
  }
}

class MusicManagerCardEditor extends HTMLElement {
  constructor() {
    super();this.attachShadow({mode:'open'});this._options=[];
    this._registryRequested=false;this._registryError='';
  }
  setConfig(config) {
    this._config={...config,name:config.name??'',controls:{...CONTROL_DEFAULTS,...config.controls}};
    this._renderPreservingInput();
  }
  set hass(hass) {
    this._hass=hass;
    if(!this._registryRequested) {
      this._registryRequested=true;
      const cached=sonosOptions(hass);
      if(cached.length){this._options=cached;this._render();}
      // Entity registry is read-only; no new access rights or custom services.
      Promise.resolve().then(()=>hass.callWS({type:'config/entity_registry/list'})).then(entries=>{
        this._registry=entries;this._options=sonosOptions(this._hass,entries);this._registryError='';this._renderPreservingInput();
      }).catch(()=>{
        this._registryError=this._options.length?'':'Die Sonos-Geräteliste ist nicht verfügbar. Prüfe die Sonos-Integration und deine Berechtigungen.';
        this._renderPreservingInput();
      });
    }
    if(!this.shadowRoot.firstChild)this._render();
  }
  connectedCallback() {this._render();}
  disconnectedCallback() {this._unbind?.();this._unbind=null;}
  _emit() {
    this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:{...this._config,controls:{...this._config.controls}}},bubbles:true,composed:true}));
  }
  _renderPreservingInput() {
    const input=this.shadowRoot.activeElement;
    const saved=input?.tagName==='INPUT'?{id:input.id,value:input.value,start:input.selectionStart,end:input.selectionEnd}:null;
    this._render();
    if(saved){const next=this.shadowRoot.getElementById(saved.id);if(next){next.value=saved.value;next.focus();if(saved.start!==null)next.setSelectionRange(saved.start,saved.end);}}
  }
  _render() {
    if(!this._config)return;
    const names={play_pause:'Play / Pause',previous:'Vorheriger Titel',next:'Nächster Titel',shuffle:'Shuffle (Apple Music)',volume:'Lautstärke'};
    const options=[...this._options];
    const selected=options.find(o=>o.value===this._config.entity);
    const maOptions=[{value:'',label:'Automatisch – dieselbe Sonos-Box'},...musicAssistantOptions(this._hass,this._registry,this._config.entity)];
    this._maOptions=maOptions;
    let maSelected=maOptions.find(o=>o.value===(this._config.music_assistant_entity||''));
    if(!maSelected && this._config.music_assistant_entity){maSelected={value:this._config.music_assistant_entity,label:this._config.music_assistant_entity,description:'Zuordnung zur Sonos-Box prüfen'};maOptions.push(maSelected);}
    if(this._config.entity&&!selected)options.push({value:this._config.entity,label:this._hass?.states?.[this._config.entity]?.attributes?.friendly_name||this._config.entity,description:'Aktuell konfiguriert – Sonos-Zuordnung prüfen'});
    this.shadowRoot.innerHTML=`<style>${UI_CSS}\n${MUSIC_CSS}</style><div class="music-editor">
      ${combobox({id:'music-entity',label:'Sonos-Box',items:options,value:selected?.label||this._config.entity||'',selected:this._config.entity||'',action:'entity-select',placeholder:'Sonos-Box auswählen …',required:true,emptyLabel:'Keine Sonos-Box gefunden.'})}
      ${this._registryError?notice(this._registryError,{error:true}):''}
      ${combobox({id:'music-ma-entity',label:'Apple Music: Music-Assistant-Player',items:maOptions,value:maSelected?.label||'',selected:this._config.music_assistant_entity||'',action:'ma-entity-select',placeholder:'Automatisch – dieselbe Sonos-Box',emptyLabel:'Keine passende Music-Assistant-Box gefunden.'})}
      ${section({id:'music-editor-controls',title:'Bedienelemente anzeigen',content:Object.entries(names).map(([key,label])=>row({title:label,trailing:toggle({label,action:'control-toggle',checked:this._config.controls[key],iconOnly:true,data:{key}})})).join('')})}
      ${notice('Die Box wird pro Karte festgelegt. Favoriten gehören deinem angemeldeten HA-Benutzer und erscheinen bei allen Boxen. Oberfläche und Music-Manager-Connector werden gemeinsam über den Marketplace installiert. Apple Music findet den Music-Assistant-Player derselben Box automatisch. Die Apple-Music-Kontozuordnung erfolgt einmal pro HA-Benutzer unter Geräte & Dienste → Music Manager → Konfigurieren.')}
      ${versionInfo({frontend:MUSIC_VERSION,ui:UI_VERSION})}
    </div>`;
    if(!this._unbind)this._unbind=bindUI(this.shadowRoot,({action,data,value,checked})=>{
      if(action==='entity-select' && (this._options.some(o=>o.value===value)||value===this._config.entity)) {
        this._config={...this._config,entity:value,music_assistant_entity:''};
        // Selection is complete: preserving focus on the replaced search input
        // would reopen the in-flow list and shift the next clicked control.
        this.shadowRoot.activeElement?.blur?.();
        this._emit();
        this.shadowRoot.querySelector('[data-ui-combo-toggle]')?.focus();
      }
      if(action==='ma-entity-select' && this._maOptions.some(o=>o.value===value)) {
        this._config={...this._config,music_assistant_entity:value};
        this.shadowRoot.activeElement?.blur?.();this._emit();
        this.shadowRoot.querySelector('#music-ma-entity')?.focus();
      }
      if(action==='control-toggle' && Object.hasOwn(CONTROL_DEFAULTS,data.key)) {
        this._config={...this._config,controls:{...this._config.controls,[data.key]:checked}};this._emit();this._renderPreservingInput();
      }
    });
  }
}

if(!customElements.get('music-manager-card'))customElements.define('music-manager-card',MusicManagerCard);
if(!customElements.get('music-manager-card-editor'))customElements.define('music-manager-card-editor',MusicManagerCardEditor);
window.customCards=window.customCards||[];
if(!window.customCards.some(card=>card.type==='music-manager-card'))window.customCards.push({
  type:'music-manager-card',name:'Music Manager',description:'Sonos, persönliche Radiofavoriten und Apple Music. Mit HA UI Kit.',preview:true
});

(() => {
const {UI_CSS, row, button, dialog, field, notice, loadingState, bindUI, escapeHtml} = MusicManagerUI;


/** An entities-card row. The backend resolves the configured owner and box. */
class MusicManagerAlarmRow extends HTMLElement {
  constructor() { super();this.attachShadow({mode:'open'});this._epoch=0;this._data=null;this._error=''; }
  setConfig(config) {
    if(!/^[a-z0-9][a-z0-9_]{0,63}$/.test(config?.alarm_id||''))throw new Error('Bitte eine gültige Weckerkennung angeben.');
    this._config={...config};this._reset();this._ensure();this._load();
  }
  set hass(hass) {
    const changed=this._hass?.user?.id!==hass.user?.id||this._hass?.connection!==hass.connection;
    this._hass=hass;
    if(changed){this._reset();this._ensure();this._load();}
  }
  connectedCallback() { this._ensure();if(!this._unbind)this._unbind=bindUI(this.shadowRoot,event=>this._action(event));this._load(); }
  disconnectedCallback() { this._reset();this._unbind?.();this._unbind=null; }
  _reset() { this._epoch++;this._loading=false;this._saving=false;this._data=null;this._loadedKey=null;this._error='';this._query='';this._dialog?.close(); }
  _ensure() {
    if(!this._config)return;
    if(!this._dialog){
      this.shadowRoot.innerHTML=`<style>${UI_CSS}${MUSIC_DIALOG_CSS}
        :host{display:block;min-width:0}
        .alarm-row .setting-row{border:0;padding:0;min-height:48px}
        .alarm-row .row-text{min-width:0}.alarm-row .row-text small{overflow-wrap:anywhere}
        .alarm-row button{min-height:44px}
        .alarm-browser{display:grid;grid-template-columns:minmax(0,1fr);gap:16px;min-width:0}
        .alarm-song-list{display:grid;gap:8px;list-style:none;margin:0;padding:0;min-width:0}
        .alarm-song-list button{display:flex;align-items:center;gap:12px;text-align:start;width:100%;min-height:64px;padding:12px;border:1px solid var(--divider-color,#ddd);border-radius:12px;color:var(--primary-text-color,#212121)}
        .alarm-song-list button[aria-pressed="true"]{border-color:var(--primary-color,#03a9f4);background:color-mix(in srgb,var(--primary-color,#03a9f4) 10%,transparent)}
        .alarm-choice-mark{display:grid;place-items:center;flex:0 0 22px;width:22px;height:22px;border:2px solid var(--divider-color,#ddd);border-radius:50%;color:transparent}
        [aria-pressed="true"] .alarm-choice-mark{border-color:var(--primary-color,#03a9f4);background:var(--primary-color,#03a9f4);color:var(--text-primary-color,#fff)}
        .alarm-choice-name{min-width:0;overflow-wrap:anywhere}.alarm-choice-name small{display:block}
        #alarm-current .setting-row{align-items:flex-start;flex-wrap:wrap;gap:8px}#alarm-current .row-text{flex-basis:200px}
        @media(max-width:600px){.alarm-row .setting-row{display:grid;grid-template-columns:minmax(0,1fr);gap:8px}.alarm-row button{width:100%}#alarm-current button{width:100%}}
      </style><div class="alarm-row" id="alarm-row"></div>${dialog({id:'alarm-dialog',title:'Weckmusik auswählen',content:'<div class="alarm-browser" id="alarm-content"></div>'})}`;
      this._dialog=this.shadowRoot.getElementById('alarm-dialog');
      this.shadowRoot.addEventListener('input',event=>{if(event.target.id==='alarm-song-query'){this._query=event.target.value;this._renderChoices();}});
      this._dialog.addEventListener('close',()=>{this._epoch++;this._loading=false;this._saving=false;this._render();this.shadowRoot.querySelector('[data-action="alarm-open"]')?.focus();});
    }
    this._render();
  }
  _request(action,extra={}) { return this._hass.callWS({type:'music_manager/alarm',action,alarm_id:this._config.alarm_id,...extra}); }
  async _load(force=false) {
    if(!this.isConnected||!this._hass?.user?.id||!this._config||this._loading||this._saving)return;
    const key=this._hass.connection, user=this._hass.user.id;
    if(!force&&this._loadedKey?.connection===key&&this._loadedKey?.user===user&&this._loadedKey?.id===this._config.alarm_id)return;
    const epoch=++this._epoch;this._loading=true;this._error='';this._render();
    try {
      const data=await this._request('get');if(epoch!==this._epoch)return;
      this._data=data;this._loadedKey={connection:key,user,id:this._config.alarm_id};
    } catch(error) { if(epoch===this._epoch)this._error=String(error?.message||error?.code||error); }
    finally { if(epoch===this._epoch){this._loading=false;this._render();} }
  }
  async _action({action,value,data}) {
    if(action==='alarm-open'){
      this._query='';this._dialog.showModal();await this._load(true);return;
    }
    if(action==='alarm-retry'){await this._load(true);return;}
    if(action==='alarm-clear')value='';
    if(action==='alarm-select')value??=data?.uri;
    if(!['alarm-select','alarm-clear'].includes(action)||this._saving||this._loading)return;
    const current=this._data;
    if(value!==''&&!(current?.songs||current?.favorites)?.some(f=>f.media_type==='track'&&f.uri===value))return;
    const epoch=++this._epoch;this._saving=true;this._error='';this._render();
    try {
      const data=await this._request('select',{uri:value});if(epoch!==this._epoch)return;
      this._data=data;this._saving=false;this._dialog.close();
    } catch(error) { if(epoch===this._epoch)this._error=String(error?.message||error?.code||error); }
    finally { if(epoch===this._epoch){this._saving=false;this._render();} }
  }
  _render() {
    if(!this._dialog)return;
    const busy=this._loading||this._saving,selected=this._data?.selection;
    this.shadowRoot.getElementById('alarm-row').innerHTML=row({title:this._config.name||'Weckmusik',description:this._error||selected?.title||(this._loading?'Wird geladen …':'Letzte Sonos-Wiedergabe'),trailing:button({label:'Auswählen',action:'alarm-open',disabled:busy||!this._hass?.user?.id})});
    const items=(this._data?.songs||this._data?.favorites||[]).filter(f=>f.media_type==='track');
    // The list contains marked songs only. Keep an older saved selection in
    // the status text, without adding albums or removed songs to the list.
    this.shadowRoot.getElementById('alarm-content').innerHTML=
      (this._data?row({title:this._data.owner,description:this._data.source}):'')+
      (this._error?notice(this._error,{error:true})+button({label:'Erneut laden',action:'alarm-retry',disabled:busy}):'')+
      (busy?loadingState(this._saving?'Weckmusik wird gespeichert …':'Weckmusik wird geladen …'):'')+
      (this._data?`<div id="alarm-current">${selected?row({title:selected.title,description:'Gespeicherte Weckmusik',trailing:button({label:'Auswahl zurücksetzen',action:'alarm-clear',disabled:busy})}):notice('Ohne ausgewähltes Wecklied wird wie bisher die letzte Sonos-Wiedergabe fortgesetzt.')}</div>`+
        (selected&&this._data.selection_compatible===false?notice('Die gespeicherte Weckmusik gehört nicht mehr zum zugeordneten Apple-Music-Konto. Bitte neu auswählen.',{error:true}):selected&&!(this._data.in_songs??this._data.in_favorites)?notice('Die bisherige Weckmusik bleibt gespeichert. Für eine neue Auswahl füge einen einzelnen Titel zur Wecklied-Liste hinzu.'):!items.length?notice('Markiere zuerst einen einzelnen Titel in Music Manager über das Weckersymbol als Wecklied.'):'')+
        field({id:'alarm-song-query',label:'Wecklied suchen',type:'search',value:this._query||'',placeholder:'Liedname',maxLength:200,autocomplete:'off',disabled:busy})+
        '<div id="alarm-song-count" class="hint" aria-live="polite"></div><ul class="alarm-song-list" id="alarm-song-list" aria-label="Verfügbare Wecklieder"></ul>':'');
    this._renderChoices();
  }
  _renderChoices() {
    const list=this.shadowRoot.getElementById('alarm-song-list');if(!list)return;
    const songs=(this._data?.songs||this._data?.favorites||[]).filter(f=>f.media_type==='track');
    const query=(this._query||'').trim().toLocaleLowerCase(),items=songs.filter(f=>f.title.toLocaleLowerCase().includes(query));
    this.shadowRoot.getElementById('alarm-song-count').textContent=`${items.length} von ${songs.length} Weckliedern · Antippen zum Auswählen`;
    list.setAttribute('aria-busy',String(this._loading||this._saving));
    list.innerHTML=items.map(song=>{
      const selected=song.uri===this._data.selection?.uri;
      return `<li>${button({label:song.title,action:'alarm-select',data:{uri:song.uri},disabled:this._loading||this._saving}).replace('<button ',`<button aria-pressed="${selected}" aria-label="${escapeHtml('Wecklied auswählen: '+song.title)}" `).replace(`<span>${escapeHtml(song.title)}</span>`,`<span class="alarm-choice-mark" aria-hidden="true">✓</span><span class="alarm-choice-name">${escapeHtml(song.title)}${selected?'<small>Ausgewählt</small>':''}</span>`)}</li>`;
    }).join('')||`<li>${notice('Keine passenden Wecklieder.')}</li>`;
  }
}
if(!customElements.get('music-manager-alarm-row'))customElements.define('music-manager-alarm-row',MusicManagerAlarmRow);

})();
(() => {
const {UI_CSS, UI_VERSION, panelHeader, section, row, button, iconButton, field, selectField, dialog, notice, feedback, formError, emptyState, loadingState, busyButton, versionInfo, bindUI} = MusicManagerUI;

/** Configuration panel: all writes go through HA's existing validated options flows. */
class MusicManagerPanel extends HTMLElement {
  constructor() { super();this.attachShadow({mode:'open'});this._epoch=0;this._editorEpoch=0;this._data=null;this._error='';this._message=''; }
  set hass(hass) {
    const changed=this._hass?.user?.id!==hass.user?.id||this._hass?.user?.is_admin!==hass.user?.is_admin||this._hass?.connection!==hass.connection;
    if(changed){this._epoch++;this._cancelEditor();this._data=null;this._error='';this._message='';this._loading=false;}
    this._hass=hass;if(changed&&this.isConnected){this._ensure();this._load();}
  }
  connectedCallback() { this._ensure();this._unbind ||= bindUI(this.shadowRoot,event=>this._action(event));this._load(); }
  disconnectedCallback() { this._epoch++;this._cancelEditor();this._unbind?.();this._unbind=null;this._loading=false; }
  _ensure() {
    if(!this.shadowRoot.getElementById('configuration'))this.shadowRoot.innerHTML=`<style>${UI_CSS}:host{display:block;height:100%;overflow:auto;background:var(--primary-background-color,var(--secondary-background-color,#fafafa))}.configuration-shell{max-width:960px;margin:0 auto}.configuration-card{margin:16px 0}.configuration-fields{display:grid;grid-template-columns:minmax(0,1fr);gap:16px}.configuration-dialog{margin:24px auto auto;max-height:calc(100dvh - 48px)}</style><div id="configuration"></div><div id="configuration-editor"></div>`;
    this._render();
  }
  _render() {
    const host=this.shadowRoot.getElementById('configuration');if(!host)return;
    if(!this._hass?.user?.is_admin){host.innerHTML=feedback('Die Konfiguration ist nur für Administratoren verfügbar.',{kind:'error'});return;}
    const busy=this._loading||this._editorBusy||this._saving;
    let content=this._data?'':loadingState('Konfiguration wird geladen …');
    if(this._error)content+=feedback(this._error,{kind:'error'});
    if(this._message)content+=feedback(this._message,{kind:'success'});
    if(this._data){
      const {connection,accounts,alarms}=this._data;
      const edit=(action,id,label)=>iconButton({icon:'edit',label,action,data:{id},disabled:busy});
      const remove=(action,id,label)=>iconButton({icon:'trash',label,action,data:{id},disabled:busy,danger:true});
      content+=`<ha-card class="configuration-card"><main>`+
        section({id:'connection',title:'Music Assistant',content:row({title:connection.name||'Nur Radio',description:!connection.id?'Apple Music kann später verbunden werden.':connection.reachable?'Verbindung verfügbar':'Verbindung derzeit nicht erreichbar',trailing:edit('connect','','Verbindung bearbeiten')})})+
        section({id:'accounts',title:`Benutzer (${accounts.length})`,trailing:button({label:'Zuordnung',icon:'add',action:'add',disabled:busy}),content:accounts.length?accounts.map(a=>row({title:a.ha_name,description:`Music Assistant: ${a.ma_name} · ${a.provider_name}`,trailing:edit('edit',a.ha_user_id,`Zuordnung bearbeiten: ${a.ha_name}`)+remove('remove',a.ha_user_id,`Zuordnung entfernen: ${a.ha_name}`)})).join(''):emptyState('Noch keine Benutzer zugeordnet. Verbinde persönliche HA- und Apple-Music-Konten.')})+
        section({id:'alarms',title:`Wecker (${alarms.length})`,trailing:button({label:'Wecker hinzufügen',icon:'add',action:'alarm',disabled:busy||!accounts.length}),content:notice('Lege für jede Person eigene Wecker mit eigener Sonos-Box und persönlicher Weckmusik an. Auch mehrere Wecker pro Person sind möglich.')+(alarms.length?alarms.map(a=>row({title:`${a.owner_name} · ${a.alarm_id}`,description:`${a.source_name} · ${a.music_readable?(a.music_title||'Letzte Sonos-Wiedergabe'):'Weckmusik derzeit nicht lesbar'}`,trailing:edit('alarm_edit',a.alarm_id,`Wecker bearbeiten: ${a.alarm_id}`)+remove('alarm_remove',a.alarm_id,`Wecker entfernen: ${a.alarm_id}`)})).join(''):emptyState(accounts.length?'Noch keine Wecker zugeordnet.':'Ordne zuerst ein persönliches Apple-Music-Konto zu.'))})+
        `</main></ha-card>`+versionInfo({frontend:MUSIC_VERSION,backend:this._data.version,ui:UI_VERSION});
    }
    host.innerHTML=panelHeader({title:'Music Manager',busy,save:false})+`<main class="configuration-shell">${content}</main>`;
  }
  async _load() {
    if(!this.isConnected||!this._hass?.user?.is_admin||this._loading)return;
    const epoch=++this._epoch;this._loading=true;this._error='';this._render();
    try{const data=await this._hass.callWS({type:'music_manager/configuration'});if(epoch===this._epoch)this._data=data;}
    catch{if(epoch===this._epoch)this._error='Die Konfiguration konnte nicht geladen werden. Bitte neu laden.';}
    finally{if(epoch===this._epoch){this._loading=false;this._render();}}
  }
  _text(part,key,fallback) { return this._hass?.localize?.(`component.music_manager.options.${part}.${key}`)||fallback; }
  _flowError(step) {
    const code=step.reason||step.errors?.base;
    return this._text(step.reason?'abort':'error',code,({duplicate_alarm:'Diese Weckerkennung ist bereits vergeben. Wähle für den neuen Wecker eine andere Kennung. Bestehende Wecker kannst du über das Stiftsymbol bearbeiten.',invalid_alarm:'Weckerkennung, Benutzer, Apple-Music-Zuordnung und Boxfreigaben prüfen.',invalid_account:'Bitte gültige Konten aus den Listen wählen.',duplicate_account:'Dieses Konto ist bereits einem anderen Benutzer zugeordnet.',account_filter:'Im MA-Benutzer muss genau die zugehörige Apple-Music-Quelle freigegeben sein.',no_accounts:'Ordne zuerst ein persönliches Apple-Music-Konto zu.',cannot_connect:'Music Assistant ist nicht erreichbar oder darf keine Benutzer lesen.'})[code]||'Die Einstellung konnte nicht übernommen werden. Bitte Verbindung und Auswahl prüfen.');
  }
  _deleteFlow(flow) { if(flow?.id)flow.hass.callApi('DELETE',`config/config_entries/options/flow/${encodeURIComponent(flow.id)}`).catch(()=>{}); }
  _cancelEditor() {
    this._editorEpoch++;this._deleteFlow(this._flow);this._flow=null;this._editorBusy=false;this._saving=false;
    if(this._dialog?.open)this._dialog.close();
  }
  async _open(action,id='') {
    if(!this._data||this._editorBusy||this._saving)return;
    this._cancelEditor();const epoch=++this._editorEpoch,hass=this._hass;this._editorBusy=true;this._message='';this._render();
    this._makeDialog(action,loadingState('Einstellung wird geladen …'));
    let flow;
    try{
      let step=await hass.callApi('POST','config/config_entries/options/flow',{handler:this._data.entry_id});
      flow={id:step.flow_id,hass,action,target:id};
      if(epoch!==this._editorEpoch){this._deleteFlow(flow);return;}
      if(step.type!=='menu'||!step.menu_options?.includes(action))throw new Error('Unavailable action');
      this._flow=flow;
      step=await hass.callApi('POST',`config/config_entries/options/flow/${encodeURIComponent(flow.id)}`,{next_step_id:action});
      if(epoch!==this._editorEpoch)return;
      if((action==='edit'||action==='alarm_edit')&&step.type==='form')step=await hass.callApi('POST',`config/config_entries/options/flow/${encodeURIComponent(flow.id)}`,{[action==='edit'?'ha_user_id':'alarm_id']:id});
      if(epoch!==this._editorEpoch)return;
      this._editorBusy=false;this._acceptStep(step);
    }catch{if(epoch===this._editorEpoch){this._deleteFlow(flow);this._flow=null;this._editorBusy=false;this._dialog.querySelector('.modal-body').innerHTML=formError('Die Einstellung konnte nicht geladen werden. Bitte schließen und erneut versuchen.');}}
    finally{if(epoch===this._editorEpoch)this._render();}
  }
  _makeDialog(action,content) {
    const titles={connect:'Music Assistant verbinden',add:'Benutzer zuordnen',edit:'Benutzerzuordnung bearbeiten',remove:'Benutzerzuordnung entfernen',alarm:'Wecker hinzufügen',alarm_edit:'Wecker bearbeiten',alarm_remove:'Wecker entfernen'};
    this.shadowRoot.getElementById('configuration-editor').innerHTML=dialog({id:'configuration-dialog',title:titles[action]||'Einstellung bearbeiten',content});
    this._dialog=this.shadowRoot.getElementById('configuration-dialog');this._dialog.classList.add('configuration-dialog');
    this._dialog.addEventListener('close',()=>{this._cancelEditor();this._render();this.shadowRoot.querySelector(`[data-action="${action}"]`)?.focus();});
    this._dialog.addEventListener('cancel',event=>{if(this._saving)event.preventDefault();});this._dialog.showModal();
  }
  _acceptStep(step,submitted={}) {
    if(step.type==='abort'){this._dialog.querySelector('.modal-body').innerHTML=formError(this._flowError(step));this._deleteFlow(this._flow);this._flow=null;return;}
    if(step.type!=='form')throw new Error('Unsupported options flow step');
    this._flow.step=step;this._draft={...submitted};
    const removing=['remove','alarm_remove'].includes(this._flow.action);
    const labels={ha_user_id:'Home-Assistant-Benutzer',ma_user_id:'Music-Assistant-Benutzer',provider_id:'Apple-Music-Konto',alarm_id:'Weckerkennung',source_entity:'Sonos-Box',music_assistant_entry:'Music-Assistant-Verbindung'};
    const fields=step.data_schema.map(item=>{
      const name=item.name,options=item.selector?.select?.options;
      const normalized=options?.map(o=>typeof o==='string'?{value:o,label:o}:o);
      const value=Object.hasOwn(submitted,name)?submitted[name]:Object.hasOwn(item,'default')?item.default:normalized?.[0]?.value||'';
      this._draft[name]=value;
      const label=this._text('step',`${step.step_id}.data.${name}`,labels[name]||name),id='config-'+name;
      if(removing)return '';
      return normalized?selectField({id,name,label,value,options:normalized,disabled:this._saving||(normalized.length===1&&['ha_user_id','alarm_id'].includes(name))}):field({id,name,label,value,required:!!item.required,maxLength:64,disabled:this._saving});
    }).join('');
    if(removing){const key=this._flow.action==='remove'?'ha_user_id':'alarm_id';this._draft[key]=this._flow.target;}
    const descriptions={connect:'Wähle die Music-Assistant-Verbindung. Bei einer anderen Verbindung oder Nur Radio werden die Apple-Music-Benutzerzuordnungen entfernt.',add:'Ordne einen HA-Benutzer seinem MA-Benutzer und persönlichen Apple-Music-Konto zu. In MA muss genau diese Musikquelle für den Benutzer freigegeben sein.',edit:'Die gespeicherten Konten sind vorausgefüllt. Der HA-Benutzer bleibt fest zugeordnet.',remove:'Der Benutzer verliert den Apple-Music-Zugang über Music Manager. Seine Radiofavoriten bleiben erhalten.',alarm:'Füge einen weiteren Wecker hinzu: Die vorgeschlagene Kennung ist noch frei. Du kannst eine eigene eindeutige Kennung eingeben. Wähle die Person und ihre Sonos-Box; persönliche Weckmusik wird getrennt gespeichert. Dieselbe Kennung gehört in die Weckerkarte und die Automation. Bestehende Wecker bleiben erhalten.',alarm_edit:'Benutzer und Sonos-Box sind vorausgefüllt. Die Weckerkennung bleibt erhalten.',alarm_remove:'Die Weckerzuordnung wird entfernt. Zugehörige Automationen können diese Kennung danach nicht mehr starten.'};
    const description=this._text('step',`${step.step_id}.description`,descriptions[this._flow.action]);
    const selected=removing?(this._flow.action==='remove'?this._data.accounts.find(a=>a.ha_user_id===this._flow.target)?.ha_name:this._flow.target):'';
    this._dialog.querySelector('.modal-body').innerHTML=(step.errors?.base?formError(this._flowError(step)):'')+notice(description)+(removing?row({title:selected||'Zuordnung entfernen'}):`<div class="configuration-fields">${fields}</div>`);
    this._dialog.querySelector('footer').innerHTML=button({label:'Abbrechen',action:'editor-cancel',disabled:this._saving})+busyButton({label:removing?'Entfernen':'Speichern',busy:this._saving,action:'editor-save',variant:removing?'danger':'primary'});
    this._dialog.querySelector('[data-ui="close-dialog"]').disabled=!!this._saving;
  }
  async _submit(confirmed=false) {
    if(!this._flow||this._saving)return;
    const flow=this._flow,step=flow.step,removing=['remove','alarm_remove'].includes(flow.action);
    if(!removing&&!confirmed)for(const item of step.data_schema){const input=this.shadowRoot.getElementById('config-'+item.name);if(!input?.reportValidity())return;this._draft[item.name]=input.value;}
    const submitted={...this._draft};
    if(flow.action==='connect'&&submitted.music_assistant_entry!==this._data.connection.id&&this._data.accounts.length&&!confirmed){
      this._dialog.querySelector('.modal-body').innerHTML=notice('Beim Wechsel der Music-Assistant-Verbindung werden alle Apple-Music-Benutzerzuordnungen entfernt. Sie müssen für die neue Verbindung erneut eingerichtet werden.');
      this._dialog.querySelector('footer').innerHTML=button({label:'Zurück',action:'editor-back'})+button({label:'Verbindung wechseln',action:'editor-confirm',variant:'danger'});return;
    }
    const epoch=this._editorEpoch;this._saving=true;this._render();this._acceptStep(step,submitted);
    try{
      const result=await flow.hass.callApi('POST',`config/config_entries/options/flow/${encodeURIComponent(flow.id)}`,submitted);
      if(epoch!==this._editorEpoch)return;
      if(result.type==='create_entry'){this._flow=null;this._saving=false;this._dialog.close();this._message=removing?'Zuordnung entfernt.':'Einstellung gespeichert.';await this._load();}
      else {this._saving=false;this._acceptStep(result,submitted);}
    }catch{if(epoch===this._editorEpoch){this._saving=false;this._acceptStep(step,submitted);this._dialog.querySelector('.modal-body').insertAdjacentHTML('afterbegin',formError('Speichern konnte nicht bestätigt werden. Lade die Übersicht neu, um den gespeicherten Stand zu prüfen.'));}}
    finally{if(epoch===this._editorEpoch)this._render();}
  }
  async _action({action,data}) {
    if(action==='menu'){this.dispatchEvent(new CustomEvent('hass-toggle-menu',{bubbles:true,composed:true}));return;}
    if(action==='reload'){await this._load();return;}
    if(action==='editor-cancel'){if(!this._saving)this._dialog.close();return;}
    if(action==='editor-save'){await this._submit();return;}
    if(action==='editor-confirm'){await this._submit(true);return;}
    if(action==='editor-back'){this._acceptStep(this._flow.step,this._draft);return;}
    if(['connect','add','edit','remove','alarm','alarm_edit','alarm_remove'].includes(action)){this._targetId=data.id||'';await this._open(action,this._targetId);}
  }
}
if(!customElements.get('music-manager-panel'))customElements.define('music-manager-panel',MusicManagerPanel);

})();