import React from 'react';
import PropTypes from 'prop-types';
import './App.scss';
import arrowSvg from './arrow.svg';

class Arrows extends React.Component {
  constructor (props) {
    super(props);
    this.arrowQuote = this.arrowQuote.bind(this);
  }

  arrowQuote () {
    this.props.changeFunc(this.props.isForward);
  }

  render () {
    // console.log(arrowSvg);
    return <img
      id={this.props.isForward ? 'new-quote' : ''}
      src={arrowSvg}
      onClick={this.arrowQuote}
      className={this.props.isForward ? 'arrow-button-forward' : 'arrow-button-backward'}
      />;
  }
}

Arrows.propTypes = {
  changeFunc: PropTypes.func,
  isForward: PropTypes.bool
};

class Quote extends React.Component {
  #isNoQuote = true;
  constructor (props) {
    super(props);
    this.state = { quotes: null, currQuote: null };

    this.getQuote = this.getQuote.bind(this);
    this.changeQuote = this.changeQuote.bind(this);
  }

  getQuote () {
    this.#isNoQuote = false;
    fetch('https://api.quotable.io/random')
      .then(
        value => value.json()
      )
      .then(
        value => this.setState((state, props) => {
          const quoteData = {
            quotes: [value],
            currQuote: null
          };
          if (Array.isArray(state.quotes)) {
            quoteData.quotes = state.quotes.concat(quoteData.quotes);
            if (quoteData.quotes.length > 10) {
              quoteData.quotes = quoteData.quotes.slice(quoteData.quotes.length - 10);
            }
          }
          quoteData.currQuote = quoteData.quotes.length - 1;
          return quoteData;
        })
      );
  }

  changeQuote (isForward) {
    if (isForward) {
      if ((this.state.currQuote + 1) < this.state.quotes.length) {
        this.setState((state, props) => ({
          quotes: [...state.quotes],
          currQuote: state.currQuote + 1
        }));
      } else {
        this.getQuote();
      }
    } else if (!isForward && this.state.quotes.length > 1 && this.state.currQuote >= 1) {
      this.setState((state, props) => ({
        quotes: [...state.quotes],
        currQuote: state.currQuote - 1
      }));
    }
  }

  componentDidMount () {
    if (this.#isNoQuote) this.getQuote();
  }

  render () {
    const quoteData = this.state.quotes;
    const currIdx = this.state.currQuote;

    if (this.#isNoQuote || quoteData === null) {
      return <div id='wait-quote' ><span>Kindly Wait...</span></div>;
    }

    const quoteContent = quoteData && quoteData[currIdx].content;
    const quoteAuthor = quoteData && quoteData[currIdx].author;
    const tweetQuote = `?text=${quoteContent}\n\n${quoteAuthor}`;

    return (
      <div id='quote-box'>
        <div>
          <Arrows changeFunc={this.changeQuote} isForward={false} />
          <div id='quote-content' >
            <div id='quote-container' >
              {
                quoteData.map(quote => {
                  return (
                    <div key={quote._id} className='quotes'>
                      <span id='text'>{quote.content}</span>
                      <span id='author'>{quote.author}</span>
                    </div>
                  );
                })
              }
            </div>
          </div>
          <Arrows changeFunc={this.changeQuote} isForward={true} />
        </div>
        <a
          id='tweet-quote'
          href={encodeURI('https://twitter.com/intent/tweet' + tweetQuote)}
          target='_blank'
          rel='noreferrer'>Tweet Quote</a>
      </div>
    );
  }
}

export default Quote;
