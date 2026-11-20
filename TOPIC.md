# Topic

## Tech

React `useEffect()` — the built-in hook that synchronizes a function component with something outside React.

## Delivery

- interactive — static site plus try-it elements bound to the concept

## What I worked on

Effect code inside existing components: a data fetch and a subscription. It worked most of the time, but I could not explain when it re-ran, why a request sometimes landed late and won, or why React seemed to mount the component twice in development.

## Origin link

n/a — self-driven lesson (no repo or PR to point at).

## What I think happens

`useEffect` runs after render. The array is a list of triggers: put a variable in it and the effect runs when that variable changes. The cleanup function is the "on unmount" hook, which is why it only fires when the component disappears.

## What confuses me / what I need

- Why does the effect run twice when the component mounts, and is that a bug?
- How does the dependency array actually decide when to run? What does it compare?
- What is cleanup really for, if it is not just unmount?
- Why does my effect sometimes see old props or state?
- How does an effect end up in an infinite loop?
- When is `useEffect` simply the wrong tool — derived state, event handlers?
