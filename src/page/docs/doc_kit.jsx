/**
 * Small building blocks for Documentation articles.
 * Markup and classes are defined in docs.scss.
 */
import React from 'react';

const ICONS = {
    tip: <polyline points="20 6 9 17 4 12" />,
    info: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>,
    warning: <><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
};

const Svg = ( { children } ) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{ children }</svg>
);

/** Article shell: badge, title, intro, then the guide's content. */
export const DocArticle = ( { badge, title, intro, children } ) => (
    <article className="capms-doc-article">
        <div className="capms-doc-article-badge">
            <Svg>{ ICONS.info }</Svg>
            { badge }
        </div>
        <h1 className="capms-doc-article-title">{ title }</h1>
        { intro && <p className="capms-doc-article-intro">{ intro }</p> }
        { children }
    </article>
);

/** A titled part of an article. */
export const DocSection = ( { title, children } ) => (
    <>
        <h3 className="capms-doc-section-title">{ title }</h3>
        { children }
    </>
);

/** Numbered steps: [{ title, text, code? }] */
export const DocSteps = ( { steps } ) => (
    <div className="capms-doc-steps">
        { steps.map( ( step, i ) => (
            <div className="capms-doc-step" key={ i }>
                <div className="capms-doc-step-num">{ i + 1 }</div>
                <div className="capms-doc-step-body">
                    <h4>{ step.title }</h4>
                    <p>{ step.text }</p>
                    { step.code && <div className="capms-doc-code"><code>{ step.code }</code></div> }
                </div>
            </div>
        ) ) }
    </div>
);

/** Term → description list: [{ term, text }] */
export const DocList = ( { items } ) => (
    <ul className="capms-doc-list">
        { items.map( ( item, i ) => (
            <li key={ i }>
                <strong>{ item.term }</strong>
                <span> - { item.text }</span>
            </li>
        ) ) }
    </ul>
);

/** Tip / info / warning callout. */
export const DocNote = ( { type = 'tip', children } ) => (
    <div className={ `capms-doc-${ type }` }>
        <Svg>{ ICONS[ type ] || ICONS.info }</Svg>
        <p>{ children }</p>
    </div>
);

/** Inline code block. */
export const DocCode = ( { children } ) => (
    <div className="capms-doc-code"><code>{ children }</code></div>
);

/** Simple table: head = [..], rows = [[..], ..] */
export const DocTable = ( { head, rows } ) => (
    <div className="capms-doc-table-wrap">
        <table className="capms-doc-table">
            <thead><tr>{ head.map( ( h, i ) => <th key={ i }>{ h }</th> ) }</tr></thead>
            <tbody>
                { rows.map( ( row, r ) => (
                    <tr key={ r }>{ row.map( ( cell, c ) => <td key={ c }>{ cell }</td> ) }</tr>
                ) ) }
            </tbody>
        </table>
    </div>
);

export const DocDivider = () => <hr className="capms-doc-divider" />;
