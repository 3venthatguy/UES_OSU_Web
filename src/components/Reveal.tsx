import React, { createContext, useCallback, useContext, useRef } from 'react';
import { motion, useReducedMotion, type HTMLMotionProps } from 'motion/react';
import { useReveal } from '../lib/useReveal';
import { revealContainer, revealItem } from '../lib/motion';

/**
 * Scroll reveals.
 *
 * `<Reveal>`            — a block that fades up from below as one piece.
 * `<Reveal stagger>`    — a grid that stays put and deals its children in one
 *                         after another; each child must be a `<RevealItem>`.
 * `<RevealItem>` /
 * `<RevealButton>`      — a card inside a staggered grid.
 *
 * ── Why the transform cleanup ──
 * Framer does not reset to `transform: none` when an animation settles; it
 * leaves `transform: translateY(0px)`. Any non-`none` transform makes the
 * element the containing block for every `position: fixed` descendant, which
 * would pin the navbar to the page and centre modals on the document instead of
 * the viewport (see the comment in App.tsx). So once a reveal lands we strip the
 * inline transform back off. Framer re-writes it from its own internal state if
 * the element ever animates again, so nothing is lost.
 */

/**
 * Holds reveals back while something else is mid-flight — the splash curtain
 * lifting, or a page sliding in. Without it all three play over each other on
 * first paint.
 */
export const RevealGate = createContext(true);

/**
 * Strips the settled inline transform. See the note above.
 *
 * Exported because HeroSection's launch sequence scales the globe wrapper and
 * needs exactly the same cleanup — that wrapper is the one element on the page
 * whose descendants (RegionSheet) would be positioned against it if a stray
 * `scale(1)` were left behind.
 */
export function useSettleTransform<T extends HTMLElement>(ref: React.RefObject<T | null>) {
  return useCallback(
    (definition: unknown) => {
      if (definition !== 'visible') return;
      if (ref.current) ref.current.style.transform = '';
    },
    [ref],
  );
}

type RevealProps = HTMLMotionProps<'div'> & {
  /** Deal children in one after another instead of moving this block itself. */
  stagger?: boolean;
};

export const Reveal: React.FC<RevealProps> = ({ stagger = false, children, ...rest }) => {
  const { ref, revealed } = useReveal<HTMLDivElement>();
  const gateOpen = useContext(RevealGate);
  const reduce = useReducedMotion() ?? false;
  const onSettled = useSettleTransform(ref);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={revealed && gateOpen ? 'visible' : 'hidden'}
      variants={stagger ? revealContainer(reduce) : revealItem(reduce)}
      onAnimationComplete={onSettled}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

/**
 * A card inside a `<Reveal stagger>`. It carries no `initial`/`animate` of its
 * own — Framer propagates the container's variant state down, which is what
 * makes `staggerChildren` work.
 */
export const RevealItem: React.FC<HTMLMotionProps<'div'>> = ({ children, ...rest }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduce = useReducedMotion() ?? false;
  const onSettled = useSettleTransform(ref);

  return (
    <motion.div ref={ref} variants={revealItem(reduce)} onAnimationComplete={onSettled} {...rest}>
      {children}
    </motion.div>
  );
};

/** `<RevealItem>` for grids whose cards are themselves buttons. */
export const RevealButton: React.FC<HTMLMotionProps<'button'>> = ({ children, ...rest }) => {
  const ref = useRef<HTMLButtonElement | null>(null);
  const reduce = useReducedMotion() ?? false;
  const onSettled = useSettleTransform(ref);

  return (
    <motion.button ref={ref} variants={revealItem(reduce)} onAnimationComplete={onSettled} {...rest}>
      {children}
    </motion.button>
  );
};
