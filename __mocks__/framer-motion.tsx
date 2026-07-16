import React from "react";

function createMotionComponent(Tag: string) {
  return React.forwardRef(function MotionComponent(
    { children, variants, initial, animate, exit, whileInView, viewport, transition, style, ...props }: any,
    ref: any
  ) {
    return React.createElement(Tag, { ...props, style, ref }, children);
  });
}

export const motion = {
  section: createMotionComponent("section"),
  div: createMotionComponent("div"),
  h1: createMotionComponent("h1"),
  h2: createMotionComponent("h2"),
  p: createMotionComponent("p"),
  span: createMotionComponent("span"),
  form: createMotionComponent("form"),
};

export function AnimatePresence({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useScroll() {
  return { scrollYProgress: 0 };
}

export function useTransform() {
  return 1;
}
