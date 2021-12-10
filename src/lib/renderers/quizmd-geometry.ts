import {
  QuizMdRenderer,
  QuizMdRenderers,
  RendererParams,
} from "./quizmd-renderer";

class Point {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

abstract class GeometryRenderer extends QuizMdRenderer {
  constructor(
    allRenderers: QuizMdRenderers,
    rendererParams: RendererParams,
    contentLines: string[] = []
  ) {
    super(allRenderers, rendererParams, contentLines);
  }
}

const defaultViewBoxX = 10;
const defaultViewBoxY = 10;
const defaultViewBox = `0 0 ${defaultViewBoxX} ${defaultViewBoxY}`;

class SvgRenderer extends GeometryRenderer {
  constructor(
    allRenderers: QuizMdRenderers,
    rendererParams: RendererParams,
    contentLines: string[] = []
  ) {
    super(allRenderers, rendererParams, contentLines);
  }

  getViewBox(): string {
    return (this.rendererParams["viewBox"] as string) || defaultViewBox;
  }

  getViewBoxCenter(): Point {
    const viewBox = this.getViewBox();
    const [, , x, y] = this.getViewBox().split(/\s+/);
    return new Point(Math.round(Number(x) / 2), Math.round(Number(y) / 2));
  }

  renderOpening(): string {
    return this.getSvgTagStart();
  }

  renderClosing(): string {
    return "</svg>";
  }

  getSvgTagStart() {
    return `<svg viewBox="${this.getViewBox()}" xmlns="http://www.w3.org/2000/svg">`;
  }
}

class ShapeRenderer extends GeometryRenderer {
  constructor(
    allRenderers: QuizMdRenderers,
    rendererParams: RendererParams,
    contentLines: string[] = []
  ) {
    super(allRenderers, rendererParams, contentLines);
  }

  getFill(): string {
    return (this.rendererParams["fill"] as string) || "none";
  }

  getStroke(): string {
    return (this.rendererParams["stroke"] as string) || "black";
  }

  getStrokeWidth(): string {
    return (this.rendererParams["stroke-width"] as string) || "0.1";
  }

  getGlobalAttrs(): string {
    return `fill="${this.getFill()}" stroke-width="${this.getStrokeWidth()}" stroke="${this.getStroke()}"`;
  }
}

/**
 * Shapes centered around (cx, cy), such as circle or ellipse
 */
abstract class CenteredRenderer extends ShapeRenderer {
  constructor(
    allRenderers: QuizMdRenderers,
    rendererParams: RendererParams,
    contentLines: string[] = []
  ) {
    super(allRenderers, rendererParams, contentLines);
  }

  getCx(): string {
    return (
      (this.rendererParams["cx"] as string) || (defaultViewBoxX / 2).toString()
    );
  }

  getCy(): string {
    return (
      (this.rendererParams["cy"] as string) || (defaultViewBoxY / 2).toString()
    );
  }

  getGlobalAttrs(includeCxCy = true): string {
    if (!includeCxCy) {
      return super.getGlobalAttrs();
    }
    return `cx="${this.getCx()}" cy="${this.getCy()}" ${super.getGlobalAttrs()}`;
  }
}

abstract class PolyRenderer extends ShapeRenderer {
  constructor(
    allRenderers: QuizMdRenderers,
    rendererParams: RendererParams,
    contentLines: string[] = []
  ) {
    super(allRenderers, rendererParams, contentLines);
  }

  getPoints(): string {
    if (!("points" in this.rendererParams)) {
      throw new Error("Points not defined!");
    }
    return this.rendererParams["points"] as string;
  }

  getGlobalAttrs(): string {
    return `points="${this.getPoints()}" ${super.getGlobalAttrs()}`;
  }
}

/**
 * Shapes starting from (x, y) corner
 */
abstract class XyRenderer extends ShapeRenderer {
  constructor(
    allRenderers: QuizMdRenderers,
    rendererParams: RendererParams,
    contentLines: string[] = []
  ) {
    super(allRenderers, rendererParams, contentLines);
  }

  getX(): string {
    return (this.rendererParams["x"] as string) || "0";
  }

  getY(): string {
    return (this.rendererParams["y"] as string) || "0";
  }

  getGlobalAttrs(): string {
    return `x="${this.getX()}" y="${this.getY()}" ${super.getGlobalAttrs()}`;
  }
}

class CircleRenderer extends CenteredRenderer {
  constructor(
    allRenderers: QuizMdRenderers,
    rendererParams: RendererParams,
    contentLines: string[] = []
  ) {
    super(allRenderers, rendererParams, contentLines);
  }

  getR(): string {
    return (this.rendererParams["r"] as string) || "100";
  }

  renderOpening(): string {
    return `<circle r="${this.getR()}" ${this.getGlobalAttrs()}/>`;
  }
}

class EllipseRenderer extends CenteredRenderer {
  constructor(
    allRenderers: QuizMdRenderers,
    rendererParams: RendererParams,
    contentLines: string[] = []
  ) {
    super(allRenderers, rendererParams, contentLines);
  }

  getRx(): string {
    return (
      (this.rendererParams["rx"] as string) || (defaultViewBoxX / 2).toString()
    );
  }

  getRy(): string {
    return (
      (this.rendererParams["ry"] as string) || (defaultViewBoxY / 2).toString()
    );
  }

  renderOpening(): string {
    return `<ellipse rx="${this.getRx()}" ry="${this.getRy()}" ${this.getGlobalAttrs()}/>`;
  }
}

class PolygonRenderer extends PolyRenderer {
  constructor(
    allRenderers: QuizMdRenderers,
    rendererParams: RendererParams,
    contentLines: string[] = []
  ) {
    super(allRenderers, rendererParams, contentLines);
  }

  renderOpening(): string {
    return `<polygon ${this.getGlobalAttrs()}/>`;
  }
}

class PolylineRenderer extends PolyRenderer {
  constructor(
    allRenderers: QuizMdRenderers,
    rendererParams: RendererParams,
    contentLines: string[] = []
  ) {
    super(allRenderers, rendererParams, contentLines);
  }

  renderOpening(): string {
    return `<polyline ${this.getGlobalAttrs()}/>`;
  }
}

class RectRenderer extends XyRenderer {
  constructor(
    allRenderers: QuizMdRenderers,
    rendererParams: RendererParams,
    contentLines: string[] = []
  ) {
    super(allRenderers, rendererParams, contentLines);
  }

  getWidth(): string {
    return (this.rendererParams["width"] as string) || "100";
  }

  getHeight(): string {
    return (this.rendererParams["height"] as string) || "50";
  }

  renderOpening(): string {
    return `<rect width="${this.getWidth()}" height="${this.getHeight()}" ${this.getGlobalAttrs()}/>`;
  }
}

class RhombusRenderer extends CenteredRenderer {
  constructor(
    allRenderers: QuizMdRenderers,
    rendererParams: RendererParams,
    contentLines: string[] = []
  ) {
    super(allRenderers, rendererParams, contentLines);
  }

  getP(): string {
    return (
      (this.rendererParams["p"] as string) || (defaultViewBoxX / 2).toString()
    );
  }

  getQ(): string {
    return (
      (this.rendererParams["q"] as string) || (defaultViewBoxY / 2).toString()
    );
  }

  renderOpening(): string {
    const x = Number(this.getCx());
    const y = Number(this.getCy());
    const p = Number(this.getP());
    const q = Number(this.getQ());
    const points = `${x},${y + q / 2} ${x + p / 2},${y} ${x},${y - q / 2} ${
      x - p / 2
    },${y}`;
    return `<polygon points="${points}" ${this.getGlobalAttrs(false)}/>`;
  }
}

class SquareRenderer extends XyRenderer {
  constructor(
    allRenderers: QuizMdRenderers,
    rendererParams: RendererParams,
    contentLines: string[] = []
  ) {
    super(allRenderers, rendererParams, contentLines);
  }

  getSide(): string {
    return (this.rendererParams["side"] as string) || "100";
  }

  renderOpening(): string {
    return `<rect width="${this.getSide()}" height="${this.getSide()}" ${this.getGlobalAttrs()}/>`;
  }
}

export const renderers: QuizMdRenderers = {
  circle: CircleRenderer,
  ellipse: EllipseRenderer,
  polygon: PolygonRenderer,
  polyline: PolylineRenderer,
  rect: RectRenderer,
  rhombus: RhombusRenderer,
  square: SquareRenderer,
  svg: SvgRenderer,
};
