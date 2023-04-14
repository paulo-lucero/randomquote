# About
A simple website for providing random quotes for everyone.

Kindly visit it at: https://paulo-lucero.github.io/randomquote/

# Features
* Swipeable. Available only for touch devices, allows to change quotes by swiping left or right.
* Quotes can be tweet.

# Developer Notes
The website is build using React library. Below is the list of app react components and its description:

* `Arrows` - Rendered only on large screen devices. Responsible for changing quotes.
* `QuoteSwipeNotif` - Gives hint to the users that using touch screen, on how to change quotes. The notification is render when `touchstart` fired on the element with id "quote-content" and unrender when `touchend` event is fired.
* `QuoteContainer` - Renders the the quote container element and quote elements.
  * State properties:
    * `quotes` - Array of quotes data.
    * `quoteIndex` - The index of the `state.quotes` that will be displayed to the user.
    * `isTouched` - Boolean or `null` value. Whether to display, undisplay or unrender the `QuoteSwipeNotif` component.
    * `newCurrentPos` - If set with a `Number`, it's value will be set to the `this.animateQuoteData.currentPos`. This property is mostly used to provide adjustments on `this.animateQuoteData.currentPos`.
  * Notable Methods:
    * `restartQuoteCont`
      * Made changes in `state` properties except `state.quotes` & `state.quoteIndex`. It can be also use to re-render the `QuoteContainer` component with previous state values.
      * Parameters:
        * `showNotif` - Accepts `0`, `null`, `true` or `false` values
          * `0` - Use the previous `state.isTouched` value.
          * `null` - Unrender the `QuoteSwipeNotif` component.
          * `true | false` - show or unshown `QuoteSwipeNotif` component, providing `false` doesn't mean unrendering the `QuoteSwipeNotif` component but the `QuoteSwipeNotif` component will be automatically unrendered when fully undisplayed to the user.
        * `resetCurrentPos` - Accepts `true` or `false` values
          * `true | false` - if `true`, the `state.newCurrentPos` will set to `null` otherwise it will set to the previous `state.newCurrentPos` value. Setting `state.newCurrentPos` to `null` is necessary to avoid infinite loop on `QuoteContainer.componentDidUpdate`.
    * `changeQuote`
      * Display new quote by changing both `state.quotes` & `state.quoteIndex` or display previous quote, by changing only the `state.quoteIndex`.
      * Parameter:
        * `isForward` - Accepts `true` or `false` values
          * `true | false` - if `true`, the quote container element will move to the left to show the newly added or stored quote from the right, otherwise the quote container element will move to the right to show the newly added or stored quote from the left.