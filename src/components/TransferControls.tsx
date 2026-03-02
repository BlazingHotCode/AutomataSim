import type { ChangeEvent, RefObject } from 'react'

interface TransferControlsProps {
  onExport: () => void
  onTriggerImport: () => void
  onImportFile: (event: ChangeEvent<HTMLInputElement>) => void
  importFileInputRef: RefObject<HTMLInputElement | null>
  transferMessage: string | null
  transferMessageKind: 'success' | 'error'
  transferErrorDetails: string[]
}

function TransferControls({
  onExport,
  onTriggerImport,
  onImportFile,
  importFileInputRef,
  transferMessage,
  transferMessageKind,
  transferErrorDetails,
}: TransferControlsProps) {
  return (
    <>
      <div className="transfer-actions">
        <button className="action-button" type="button" onClick={onExport}>
          Export JSON
        </button>
        <button
          className="action-button"
          type="button"
          onClick={onTriggerImport}
        >
          Import JSON
        </button>
        <input
          ref={importFileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={onImportFile}
          className="hidden-file-input"
        />
      </div>
      {transferMessage && (
        <div
          className={
            transferMessageKind === 'success'
              ? 'transfer-message transfer-message-success'
              : 'transfer-message transfer-message-error'
          }
        >
          <p>{transferMessage}</p>
          {transferMessageKind === 'error' &&
            transferErrorDetails.length > 0 && (
              <ul className="transfer-error-list">
                {transferErrorDetails.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            )}
        </div>
      )}
    </>
  )
}

export default TransferControls
