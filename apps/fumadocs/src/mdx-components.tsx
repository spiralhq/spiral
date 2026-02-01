import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { Accordion, Accordions } from "./components/accordion";
import * as icons from "lucide-react";
import { ImageZoom } from "fumadocs-ui/components/image-zoom";

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...(icons as unknown as MDXComponents),
    ...defaultMdxComponents,
    ...components,
    img: (props) => <ImageZoom {...(props as any)} />,
    Accordion,
    Accordions,
  };
}
