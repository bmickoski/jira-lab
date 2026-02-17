import * as React from "react";

export type LazyModule<T extends React.ComponentType<unknown>> = {
  default: T;
};

export type PreloadableLazy<T extends React.ComponentType<unknown>> =
  React.LazyExoticComponent<T> & {
    preload: () => Promise<LazyModule<T>>;
  };

export function lazyWithPreload<T extends React.ComponentType<unknown>>(
  factory: () => Promise<LazyModule<T>>
): PreloadableLazy<T> {
  const Component = React.lazy(factory) as PreloadableLazy<T>;
  Component.preload = factory;
  return Component;
}
