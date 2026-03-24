function PoleFilterInputs({
  poleLineName, onPoleLineNameChange,
  poleNumber, onPoleNumberChange,
  constructionNumber, onConstructionNumberChange,
  suggestions,
  idPrefix = '',
}) {
  const id = (name) => idPrefix ? `${idPrefix}-${name}` : name

  return (
    <>
      <div className={idPrefix ? 'photolist-filter' : 'capture-field'}>
        <label>電柱番号</label>
        <div className="pole-inputs">
          <input
            id={id('pole-line-name')}
            type="text"
            list={id('pole-line-names')}
            value={poleLineName}
            onChange={(e) => onPoleLineNameChange(e.target.value)}
            placeholder="幹線名"
          />
          <datalist id={id('pole-line-names')}>
            {suggestions.poleLineNames.map((v) => <option key={v} value={v} />)}
          </datalist>
          <input
            id={id('pole-number')}
            type="text"
            list={id('pole-numbers')}
            value={poleNumber}
            onChange={(e) => onPoleNumberChange(e.target.value)}
            placeholder="番号"
          />
          <datalist id={id('pole-numbers')}>
            {suggestions.poleNumbers.map((v) => <option key={v} value={v} />)}
          </datalist>
        </div>
      </div>
      <div className={idPrefix ? 'photolist-filter' : 'capture-field'}>
        <label htmlFor={id('construction-number')}>工事番号</label>
        <input
          id={id('construction-number')}
          type="text"
          list={id('construction-numbers')}
          value={constructionNumber}
          onChange={(e) => onConstructionNumberChange(e.target.value)}
          placeholder={idPrefix ? '工事番号で絞り込み' : '工事番号を入力'}
        />
        <datalist id={id('construction-numbers')}>
          {suggestions.constructionNumbers.map((v) => <option key={v} value={v} />)}
        </datalist>
      </div>
    </>
  )
}

export default PoleFilterInputs
