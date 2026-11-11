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
