import React from 'react';
import PropTypes from 'prop-types';
import './App.scss';
import { ReactComponent as ArrowSvg } from './arrow.svg';
import { ReactComponent as TweetIcon } from './tweet.svg';
import quotesCollection from './quotes';

/**
 *
 * @param {Array} arr
 */
function genRandomIndex (arr) {
  return Math.floor(Math.random() * arr.length);
}

function isArrowsFit () {
  return document.documentElement.offsetWidth < 650;
}

class Arrows extends React.Component {
  constructor (props) {
    super(props);
    this.arrowQuote = this.arrowQuote.bind(this);
    this.hoveredArrow = this.hoveredArrow.bind(this);

    this.arrowRef = React.createRef();
  }

  arrowQuote () {
    this.props.changeFunc(this.props.isForward);
  }

  /**
   *
   * @param {MouseEvent} evt
   */
  hoveredArrow (evt) {
    const arrowEle = this.arrowRef.current;
    const isMouseenter = evt.type === 'mouseenter';
    const classEvt = 'hovered-arrow';

    if (arrowEle === null) return;

    const pathEles = arrowEle.getElementsByTagName('path');
    Array.from(pathEles).forEach(pathEle => {
      if (isMouseenter) {
        pathEle.classList.add(classEvt);
      } else {
        pathEle.classList.remove(classEvt);
      }
    });
  }

  render () {
    return !this.props.isArrowsFit
      ? <div
          id={this.props.isForward ? 'new-quote' : ''}
          onClick={this.arrowQuote}
          className={this.props.isForward ? 'arrow-button-forward' : 'arrow-button-backward'}
          ref={this.arrowRef}
          onMouseEnter={this.hoveredArrow}
          onMouseLeave={this.hoveredArrow}
          >
          <ArrowSvg />
        </div>
      : null;
  }
}

Arrows.propTypes = {
  changeFunc: PropTypes.func,
  isForward: PropTypes.bool,
  isArrowsFit: PropTypes.bool
};

class QuoteSwipeNotif extends React.Component {
  constructor (props) {
    super(props);

    this.defaultUnit = 'em';
    this.notifSize = 1.5; // em
    this.notifAnimateData = {
      timeStart: null,
      currentPos: this.props.isTouched ? this.notifSize * -1 : 0,
      finalPos: this.props.isTouched ? 0 : this.notifSize * -1
    };

    this.notifRef = React.createRef();

    this.notifAnimate = this.notifAnimate.bind(this);
  }

  notifAnimate (timeStamp) {
    const notifAnimateData = this.notifAnimateData;
    const notifElapsed = notifAnimateData.timeStart !== null
      ? timeStamp - notifAnimateData.timeStart
      : 0;

    notifAnimateData.timeStart = timeStamp;

    const finalPos = notifAnimateData.finalPos;
    const isHide = finalPos < 0;
    const addtlPos = notifElapsed * (this.notifSize / 150); // 150ms

    const newPos = isHide
      ? notifAnimateData.currentPos - addtlPos
      : notifAnimateData.currentPos + addtlPos;

    notifAnimateData.currentPos = notifElapsed !== 0 && ((isHide && newPos < finalPos) || (!isHide && newPos > finalPos))
      ? finalPos
      : newPos;

    const notifContEle = this.notifRef.current;

    if (notifContEle === null) return;
    notifContEle.style.transform = `translateY(${notifAnimateData.currentPos}${this.defaultUnit})`;
    if (notifAnimateData.currentPos !== notifAnimateData.finalPos) {
      window.requestAnimationFrame(this.notifAnimate);
    } else if (this.props.isTouched === false) {
      this.props.restartQuoteCont();
    }
  }

  shouldComponentUpdate (nextProps, nextState) {
    const notifAnimateData = this.notifAnimateData;
    const shouldUpdateNotif = this.props.isTouched !== nextProps.isTouched;
    if (!shouldUpdateNotif) return false;

    if (this.props.isTouched === null) {
      notifAnimateData.currentPos = nextProps.isTouched ? this.notifSize * -1 : 0;
    }
    notifAnimateData.finalPos = nextProps.isTouched ? 0 : this.notifSize * -1;
    return true;
  }

  componentDidUpdate (prevProps, prevState, snapshot) {
    const notifAnimateData = this.notifAnimateData;
    if (notifAnimateData.currentPos !== notifAnimateData.finalPos) {
      notifAnimateData.timeStart = null;
      window.requestAnimationFrame(this.notifAnimate);
    }
  }

  render () {
    return this.props.isTouched !== null
      ? <div
        ref={this.notifRef}
        id='swipeable-notif'
        style={{
          transform: `translateY(${this.notifAnimateData.currentPos}${this.defaultUnit})`
        }}
        >Swipe to left or right to change quote</div>
      : null;
  }
}

QuoteSwipeNotif.propTypes = {
  isTouched: PropTypes.bool,
  restartQuoteCont: PropTypes.func
};

class QuoteContainer extends React.Component {
  constructor (props) {
    super(props);

    this.quotesLimit = 10;
    this.boxDefaultSize = 800;
    this.quoteDefaultSize = 480;
    this.defaultUnit = 'px';
    this.isArrowsFit = isArrowsFit();
    this.animateQuoteData = {
      timeStart: null,
      currentPos: 0, // current position of the quote container
      finalPos: 0, // final position of the quote container
      defaultSize: null, // size/width of the quotes
      touchesData: {},
      isTouched: false
    };
    this.changeQuoteWidth();
    this.quotesData = quotesCollection;

    this.state = {
      quotes: [this.getQuote()],
      quoteIndex: 0,
      isTouched: null // if quote is touched and not released
    };

    this.quoteCont = React.createRef();
    this.tweetRef = React.createRef();

    this.changeQuoteWidth = this.changeQuoteWidth.bind(this); // called when viewport size change, responsible for setting quote elements sizes
    this.changeQuote = this.changeQuote.bind(this);
    this.animateChange = this.animateChange.bind(this);
    this.changeQuoteTouchStart = this.changeQuoteTouchStart.bind(this);
    this.changeQuoteTouchMove = this.changeQuoteTouchMove.bind(this);
    this.changeQuoteTouchEnd = this.changeQuoteTouchEnd.bind(this);
    this.restartQuoteCont = this.restartQuoteCont.bind(this); // changes on state not relating to changes in quote
    this.touchTweetQuote = this.touchTweetQuote.bind(this);
  }

  changeQuoteWidth () {
    this.isArrowsFit = isArrowsFit();
    const animateQuoteData = this.animateQuoteData;
    const prevDefaultSize = animateQuoteData.defaultSize;
    const prevCurrentPos = animateQuoteData.currentPos;
    const prevFinalPos = animateQuoteData.finalPos;

    const innerWidth = document.documentElement.offsetWidth;
    this.isLargeScrn = innerWidth >= this.boxDefaultSize;
    this.boxSize = this.isLargeScrn
      ? this.boxDefaultSize
      : innerWidth - 5;
    animateQuoteData.defaultSize = Math.min(this.quoteDefaultSize, this.boxSize - 5);
    if (typeof prevDefaultSize === 'number') {
      animateQuoteData.finalPos = (prevFinalPos / prevDefaultSize) * animateQuoteData.defaultSize;
      animateQuoteData.currentPos = prevFinalPos === 0
        ? (prevCurrentPos / prevDefaultSize) * animateQuoteData.defaultSize
        : (prevCurrentPos / prevFinalPos) * animateQuoteData.finalPos;
    }

    if ('quotesData' in this && Array.isArray(this.quotesData)) {
      this.restartQuoteCont(0);
    }
  }

  restartQuoteCont (showNotif = null, resetCurrentPos = false) {
    this.setState((state, props) => {
      const nextState = Object.assign({}, state);
      nextState.isTouched = showNotif === 0 // zero means use previous state value
        ? state.isTouched
        : showNotif;
      nextState.newCurrentPos = resetCurrentPos
        ? null
        : state.newCurrentPos;
      return nextState;
    });
  }

  getQuote () {
    const quotesData = this.quotesData;
    const randomIndex = genRandomIndex(quotesData);
    const selectedQuote = quotesData[randomIndex];

    this.quotesData = quotesData.slice(0, randomIndex).concat(quotesData.slice(randomIndex + 1, quotesData.length)); // remove selected quote
    return selectedQuote;
  }

  insertQuotesData (discardedQuote) {
    const quotesData = this.quotesData;
    const randomIndex = genRandomIndex(quotesData);

    this.quotesData = quotesData.slice(0, randomIndex).concat(discardedQuote, quotesData.slice(randomIndex, quotesData.length)); // add discarded quote
  }

  changeQuote (isForward) {
    const animateData = this.animateQuoteData;
    const quotesLimit = this.quotesLimit;
    const quoteContObj = this;
    this.setState((state, props) => {
      const prevQuotes = state.quotes;
      const newState = { isForward, newCurrentPos: null };
      const backwardGetQuote = !isForward && (state.quoteIndex - 1) < 0;

      const isGetQuote = (isForward && (state.quoteIndex + 1) === prevQuotes.length) || backwardGetQuote;

      newState.quotes = isGetQuote
        ? (
            isForward
              ? [...prevQuotes, quoteContObj.getQuote()]
              : [quoteContObj.getQuote(), ...prevQuotes]
          )
        : [...prevQuotes];

      if (isGetQuote) {
        const isMoreThanLimit = newState.quotes.length > quotesLimit;
        if (isMoreThanLimit) { // rendered number of quotes is 10 only
          quoteContObj.insertQuotesData(
            isForward
              ? newState.quotes.shift()
              : newState.quotes.pop()
          );
        }
        newState.newCurrentPos = isForward && isMoreThanLimit // the current position will point to the new quote placed at the end of array, if only when the array was exceed the limit of quotes
          ? animateData.currentPos + animateData.defaultSize
          : isForward === false // the current position will always point to the new quote placed in the beginning of the array, regardless the array exceed the limit of quotes or not
            ? animateData.currentPos - animateData.defaultSize
            : newState.newCurrentPos;
      }

      newState.quoteIndex = isGetQuote
        ? (
            isForward
              ? newState.quotes.length - 1
              : 0
          )
        : isForward
          ? state.quoteIndex + 1
          : state.quoteIndex - 1;

      return newState;
    });
  }

  /**
   *
   * @param {TouchEvent} evt
   */
  changeQuoteTouchStart (evt) {
    const animateData = this.animateQuoteData;
    const touchesData = evt.targetTouches;
    animateData.isTouched = true;
    for (let i = 0; i < touchesData.length; i++) {
      const touchObj = touchesData[i];
      const touchData = {
        xStarted: touchObj.clientX,
        yStarted: touchObj.clientY,
        xCoord: touchObj.clientX,
        yCoord: touchObj.clientY
      };
      animateData.touchesData[touchObj.identifier] = touchData;
    }

    if (!this.state.isTouched) {
      this.restartQuoteCont(!this.state.isTouched); // show swipe notification/guide
    }
  }

  /**
   *
   * @param {TouchEvent} evt
   */
  changeQuoteTouchMove (evt) {
    const touchesData = evt.changedTouches;
    const animateData = this.animateQuoteData;

    for (let i = 0; i < touchesData.length; i++) {
      const currentTouch = touchesData[i];
      const prevTouchData = animateData.touchesData?.[currentTouch.identifier];
      if (prevTouchData !== undefined) {
        const addtlPos = currentTouch.clientX - prevTouchData.xCoord;
        const currentPos = animateData.currentPos + addtlPos;
        prevTouchData.xCoord = currentTouch.clientX;
        prevTouchData.yCoord = currentTouch.clientY;
        animateData.currentPos = currentPos;

        const isForward = addtlPos < 0;
        const currentIndexPos = this.state.quoteIndex * (-animateData.defaultSize);
        const isChangeQuote = (isForward && currentPos < currentIndexPos) ||
          (!isForward && currentPos > currentIndexPos);
        if (isChangeQuote) {
          this.changeQuote(isForward);
        } else {
          const quoteContainer = this.quoteCont.current;
          if (quoteContainer !== null) {
            quoteContainer.style.transform = `translate(${animateData.currentPos}${this.defaultUnit})`;
          }
        }
        break;
      }
    }
  }

  /**
   *
   * @param {TouchEvent} evt
   */
  changeQuoteTouchEnd (evt) {
    const touchesData = evt.changedTouches;
    const animateData = this.animateQuoteData;

    for (let i = 0; i < touchesData.length; i++) {
      const endedTouch = touchesData[i];
      if (endedTouch.identifier in animateData.touchesData) {
        delete animateData.touchesData[endedTouch.identifier];
      }
    }

    if (Object.keys(animateData.touchesData).length === 0) {
      animateData.isTouched = false;
      if (this.state.isTouched) { // unshow swipe notification/guide
        this.restartQuoteCont(!this.state.isTouched);
      } else {
        this.triggerAnimateQuote();
      }
    }
  }

  animateChange (timeStamp) {
    const animateData = this.animateQuoteData;
    const quoteElapsed = animateData.timeStart !== null
      ? timeStamp - animateData.timeStart
      : 0;

    const defaultSize = animateData.defaultSize;
    const addtlPos = quoteElapsed * (defaultSize / 800); // slide moves at .8 seconds

    animateData.timeStart = timeStamp;
    animateData.finalPos = this.state.quoteIndex * (-defaultSize); // negative values move the element to left, for translate function

    const isForward = animateData.currentPos > animateData.finalPos;

    animateData.currentPos = animateData.currentPos + (
      isForward
        ? -addtlPos
        : addtlPos
    );

    const isLessThanFinal = animateData.currentPos < animateData.finalPos;

    if (quoteElapsed !== 0 && ((isForward && isLessThanFinal) || (!isForward && !isLessThanFinal))) {
      animateData.currentPos = animateData.finalPos;
    }

    const quoteContainer = this.quoteCont.current;
    if (quoteContainer !== null) {
      quoteContainer.style.transform = `translate(${animateData.currentPos}${this.defaultUnit})`;
      if (animateData.currentPos !== animateData.finalPos && !animateData.isTouched) window.requestAnimationFrame(this.animateChange);
    }
  }

  triggerAnimateQuote () {
    this.animateQuoteData.timeStart = null;
    window.requestAnimationFrame(this.animateChange);
  }

  /**
   *
   * @param {TouchEvent} evt
   */
  touchTweetQuote (evt) { // change background color of tweet icon when touched and touch is released
    const isTouchedStart = evt.type === 'touchstart';
    const tweetEle = this.tweetRef.current;

    if (tweetEle === null) return;

    const pathEles = tweetEle.getElementsByTagName('path');
    Array.from(pathEles).forEach(pathEle => {
      if (isTouchedStart) {
        pathEle.classList.add('tweet-touch');
      } else {
        pathEle.classList.remove('tweet-touch');
      }
    });
  }

  componentDidMount () {
    window.onresize = this.changeQuoteWidth;
  }

  componentDidUpdate () {
    if (typeof this.state.newCurrentPos === 'number') {
      this.animateQuoteData.currentPos = this.state.newCurrentPos;
      this.restartQuoteCont(0, true); // the new updated state will be rendered
    } else if (this.state.quotes.length > 1 && !this.animateQuoteData.isTouched) {
      this.triggerAnimateQuote();
    }
  }

  render () {
    const quoteData = this.state.quotes;
    const animateData = this.animateQuoteData;
    const defaultSize = animateData.defaultSize;
    const quoteIndex = this.state.quoteIndex;
    const tweetURI = `?text=${quoteData[quoteIndex].text}\n\n${quoteData[quoteIndex].author || 'Unknown'}`;
    const defaultUnit = this.defaultUnit;

    const quoteContentStyle = { width: `${defaultSize}${defaultUnit}` };

    if (this.isLargeScrn) {
      quoteContentStyle.margin = '0 2em';
    }

    return (
      <React.Fragment>
        <QuoteSwipeNotif
          isTouched={this.state.isTouched}
          restartQuoteCont={this.restartQuoteCont}
          />
        <div id='quote-box' style={{ width: `${this.boxSize}${defaultUnit}` }}>
          <div id='inner-quote-box' >
            <Arrows changeFunc={this.changeQuote} isForward={false} isArrowsFit={this.isArrowsFit} />
            <div
              id='quote-content'
              style={quoteContentStyle}
              onTouchStart={this.changeQuoteTouchStart}
              onTouchMove={this.changeQuoteTouchMove}
              onTouchEnd={this.changeQuoteTouchEnd} >
              <div
                ref={this.quoteCont}
                id='quote-container'
                style={{
                  transform: `translate(${animateData.currentPos}${defaultUnit})`,
                  width: `${defaultSize * this.quotesLimit}${defaultUnit}`
                }} >
                {
                  quoteData.map(quote => {
                    return (
                      <span key={quote.quoteID} className='quotes' style={{ width: `${defaultSize}${defaultUnit}` }} >
                        <span id='text' >{quote.text}</span>
                        <span id='author' >{quote.author || 'Unknown'}</span>
                      </span>
                    );
                  })
                }
              </div>
            </div>
            <Arrows changeFunc={this.changeQuote} isForward={true} isArrowsFit={this.isArrowsFit} />
          </div>
          <a
            ref={this.tweetRef}
            id='tweet-quote'
            href={encodeURI('https://twitter.com/intent/tweet' + tweetURI)}
            onTouchStart={this.touchTweetQuote}
            onTouchEnd={this.touchTweetQuote}
            onTouchCancel={this.touchTweetQuote}
            target='_blank'
            rel='noreferrer'
            >
            <TweetIcon />
          </a>
        </div>
      </React.Fragment>
    );
  }
}

export default QuoteContainer;
