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
    childLines: string[] = []
  ) {
    super(allRenderers, rendererParams, childLines);
  }
}

const defaultViewBoxX = 100;
const defaultViewBoxY = 100;
const defaultSvgWidth = "50px";
const defaultSvgHeight = "50px";
const defaultViewBox = `0 0 ${defaultViewBoxX} ${defaultViewBoxY}`;

class SvgRenderer extends GeometryRenderer {
  constructor(
    allRenderers: QuizMdRenderers,
    rendererParams: RendererParams,
    childLines: string[] = []
  ) {
    super(allRenderers, rendererParams, childLines);
    this.name = "svg";
    this.descShort = "svg";
    this.descLong = "Draw Scalable Vector Graphics (SVG)";
    this.sample = [`svg: width="30" height="40" viewBox="0 0 100 100"`];
  }

  getViewBox(): string {
    return (this.rendererParams["viewBox"] as string) || defaultViewBox;
  }

  getWidth(): string {
    return (this.rendererParams["width"] as string) || defaultSvgWidth;
  }

  getHeight(): string {
    return (this.rendererParams["height"] as string) || defaultSvgHeight;
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
    return `<svg width="${this.getWidth()}" height="${this.getHeight()}" viewBox="${this.getViewBox()}" xmlns="http://www.w3.org/2000/svg">${this.getGlobalAttrs()}`;
  }
}

class ShapeRenderer extends GeometryRenderer {
  constructor(
    allRenderers: QuizMdRenderers,
    rendererParams: RendererParams,
    childLines: string[] = []
  ) {
    super(allRenderers, rendererParams, childLines);
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
    // Space already prepended in return value, callers no need to prepend space
    // So to be consistent with QuizMdRenderer.getGlobalAttrs()
    return ` fill="${this.getFill()}" stroke-width="${this.getStrokeWidth()}" stroke="${this.getStroke()}"${super.getGlobalAttrs()}`;
  }
}

/**
 * Shapes centered around (cx, cy), such as circle or ellipse
 */
abstract class CenteredRenderer extends ShapeRenderer {
  constructor(
    allRenderers: QuizMdRenderers,
    rendererParams: RendererParams,
    childLines: string[] = []
  ) {
    super(allRenderers, rendererParams, childLines);
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
    return ` cx="${this.getCx()}" cy="${this.getCy()}"${super.getGlobalAttrs()}`;
  }
}

class GeoEntity {
  label: string = undefined;
  labelTextHeight: number = 10;
  labelCharWidth: number = 15;
  // Use offsetX instead of labelX so we only update x and label will move with it
  labelOffsetX: number = 0;
  labelOffsetY: number = 0;

  constructor(label: string = undefined) {
    this.label = label;
  }

  hasLabel(): boolean {
    return this.label !== undefined && this.label.length > 0;
  }
}

// A QuizMd geometry node
class GeoNode extends GeoEntity {
  x: number;
  y: number;

  constructor(x: number, y: number, label = undefined) {
    super(label);
    this.x = x;
    this.y = y;
  }

  getLabelX(): number {
    return this.x + this.labelOffsetX;
  }
  getLabelY(): number {
    return this.y + this.labelOffsetY;
  }
}

// A QuizMd geometry edge
class GeoEdge extends GeoEntity {
  node1: GeoNode;
  node2: GeoNode;
  // Offset from standard "middle of node1 and node2" location
  constructor(node1: GeoNode, node2: GeoNode, label = undefined) {
    super(label);
    this.node1 = node1;
    this.node2 = node2;
  }
}

abstract class PolyRenderer extends ShapeRenderer {
  nodes: GeoNode[] = [];
  edges: GeoEdge[] = [];

  constructor(
    allRenderers: QuizMdRenderers,
    rendererParams: RendererParams,
    childLines: string[] = []
  ) {
    super(allRenderers, rendererParams, childLines);
    //Init nodes
    let labels = [];
    if ("labels" in this.rendererParams) {
      labels = (this.rendererParams["labels"] + "").split(",");
    }
    const pointXys = this.getPointXys();
    const n = pointXys.length;
    const labelsFound = labels.length > 0;
    if (labelsFound && labels.length !== n) {
      throw new Error("Lengths of labels and points don't match");
    }
    for (let i = 0; i < n; i++) {
      const geoNode = new GeoNode(
        pointXys[i][0],
        pointXys[i][1],
        labelsFound ? labels[i] : undefined
      );
      this.nodes.push(geoNode);
    }
    // Init edges
    const lengths =
      "lengths" in this.rendererParams
        ? (this.rendererParams["lengths"] as string).split(",")
        : [];
    const lengthsFound = lengths.length > 0;
    if (lengthsFound && lengths.length < n - 1) {
      // Polygon: n edges, Polyline n-1 edges
      throw new Error("Lengths of lengths field and points don't match");
    }
    for (let i = 0; i < lengths.length; i++) {
      const node1 = this.nodes[i];
      const node2 = this.nodes[(i + 1) % n];
      const edge = new GeoEdge(
        node1,
        node2,
        lengthsFound ? lengths[i] : undefined
      );
      this.edges.push(edge);
    }
    this.updateLabelOffsets();
  }

  getPoints(): string {
    if (!("points" in this.rendererParams)) {
      throw new Error("Points not defined!");
    }
    return this.rendererParams["points"] as string;
  }

  getLabelFill(): string {
    if ("labelFill" in this.rendererParams) {
      return this.rendererParams["labelFill"] as string;
    }
    return this.getFill();
  }

  getGlobalAttrs(): string {
    let pointsAttr = "";
    for (const node of this.nodes) {
      pointsAttr += `${node.x},${node.y} `;
    }
    return ` points="${pointsAttr.trim()}"${super.getGlobalAttrs()}`;
  }

  private getPointXys(): number[][] {
    const pointXys = [];
    const parts = this.getPoints().split(" ");
    parts.forEach((part) => {
      const [x, y] = part.split(",");
      pointXys.push([parseInt(x), parseInt(y)]);
    });
    return pointXys;
  }

  private updateLabelOffsets(): void {
    const n = this.nodes.length;
    const labelPadding = 2;
    for (let i = 0; i < n; i++) {
      const currNode = this.nodes[i];
      if (!currNode.hasLabel()) {
        continue;
      }
      const prevNode = this.nodes[i > 0 ? i - 1 : n - 1];
      const nextNode = this.nodes[(i + 1) % n];
      const labelRadian = Math.atan2(
        currNode.y - (prevNode.y + nextNode.y) / 2,
        currNode.x - (prevNode.x + nextNode.x) / 2
      );

      if (Math.abs(labelRadian) <= Math.PI / 2) {
        currNode.labelOffsetX = labelPadding; // Label on the right, move just a tiny bit rightward
      } else {
        // Label on the left side, make sure label text doesn't overlap with graph
        currNode.labelOffsetX = Math.round(
          currNode.label.length *
            currNode.labelCharWidth *
            Math.cos(labelRadian)
        );
      }
      if (labelRadian > 0) {
        // Label under graph, leave space for text height (text x/y is for text baseline)
        currNode.labelOffsetY = currNode.labelTextHeight;
      } else {
        currNode.labelOffsetY = labelPadding;
      }
    }

    for (const edge of this.edges) {
      if (!edge.hasLabel()) {
        continue;
      }
      const deltaX = edge.node2.x - edge.node1.x;
      const deltaY = edge.node2.y - edge.node1.y;
      const slope = Math.atan2(deltaY, deltaX);
      if (edge.node1.hasLabel() && edge.node2.hasLabel()) {
        edge.labelOffsetX = Math.floor(
          (edge.node1.labelOffsetX + edge.node2.labelOffsetX) / 2
        );
        edge.labelOffsetY = Math.floor(
          (edge.node1.labelOffsetY + edge.node2.labelOffsetY) / 2
        );
      } else if (edge.node1.hasLabel()) {
        edge.labelOffsetX = edge.node1.labelOffsetX;
        edge.labelOffsetY = edge.node1.labelOffsetY;
      } else if (edge.node2.hasLabel()) {
        edge.labelOffsetX = edge.node2.labelOffsetX;
        edge.labelOffsetY = edge.node2.labelOffsetY;
      } else {
        edge.labelOffsetX == 0;
        if ((slope >= 0 && slope < Math.PI / 2) || slope <= -Math.PI / 2) {
          edge.labelOffsetY = labelPadding;
        } else {
          edge.labelOffsetY = -edge.labelTextHeight - labelPadding;
        }
      }
    }

    // Move graph to the right or downwards if labels are out of the picture
    let minLabelX = 0;
    let minLabelY = 0;
    for (const geoEntity of [...this.nodes, ...this.edges]) {
      if (!geoEntity.hasLabel()) {
        continue;
      }
      let labelX = geoEntity.labelOffsetX;
      let labelY = geoEntity.labelOffsetY;
      if (geoEntity instanceof GeoNode) {
        labelX += geoEntity.x;
        labelY += geoEntity.y;
      } else {
        labelX += (geoEntity.node1.x + geoEntity.node2.x) / 2;
        labelY += (geoEntity.node1.y + geoEntity.node2.y) / 2;
      }
      minLabelX = labelX < minLabelX ? labelX : minLabelX;
      minLabelY =
        labelY - geoEntity.labelTextHeight < minLabelY
          ? labelY - geoEntity.labelTextHeight
          : minLabelY;
    }
    if (minLabelX < 0) {
      for (const node of this.nodes) {
        node.x -= minLabelX;
      }
    }
    if (minLabelY < 0) {
      for (const node of this.nodes) {
        node.y -= minLabelY;
      }
    }
  }

  getNodeLabels(): string {
    let nodeLabels = "";
    const n = this.nodes.length;
    for (const node of this.nodes) {
      if (node.hasLabel()) {
        nodeLabels += `<text x="${node.getLabelX()}" y="${node.getLabelY()}" fill="${this.getLabelFill()}">${
          node.label
        }</text>`;
      }
    }
    return nodeLabels;
  }

  getEdgeLabels(): string {
    let edgeLabels = "";
    const n = this.edges.length;
    for (const edge of this.edges) {
      if (edge.hasLabel()) {
        edgeLabels += `<text x="${
          (edge.node1.x + edge.node2.x) / 2 + edge.labelOffsetX
        }" y="${
          (edge.node1.y + edge.node2.y) / 2 + edge.labelOffsetY
        }" fill="${this.getLabelFill()}">${edge.label}</text>`;
      }
    }
    return edgeLabels;
  }
}

/**
 * Shapes starting from (x, y) corner
 */
abstract class XyRenderer extends ShapeRenderer {
  constructor(
    allRenderers: QuizMdRenderers,
    rendererParams: RendererParams,
    childLines: string[] = []
  ) {
    super(allRenderers, rendererParams, childLines);
  }

  getX(): string {
    return (this.rendererParams["x"] as string) || "0";
  }

  getY(): string {
    return (this.rendererParams["y"] as string) || "0";
  }

  getGlobalAttrs(): string {
    return ` x="${this.getX()}" y="${this.getY()}"${super.getGlobalAttrs()}`;
  }
}

class CircleRenderer extends CenteredRenderer {
  constructor(
    allRenderers: QuizMdRenderers,
    rendererParams: RendererParams,
    childLines: string[] = []
  ) {
    super(allRenderers, rendererParams, childLines);
    this.name = "circle";
    this.descShort = "circle";
    this.descLong = "Draw a circle";
    this.sample = [`circle: r="3" cx="50" cy="50"`];
  }

  getR(): string {
    return (this.rendererParams["r"] as string) || "100";
  }

  renderOpening(): string {
    return `<circle r="${this.getR()}"${this.getGlobalAttrs()}/>`;
  }
}

class EllipseRenderer extends CenteredRenderer {
  constructor(
    allRenderers: QuizMdRenderers,
    rendererParams: RendererParams,
    childLines: string[] = []
  ) {
    super(allRenderers, rendererParams, childLines);
    this.name = "ellipse";
    this.descShort = "ellipse";
    this.descLong = "Draw an ellipse";
    this.sample = [`ellipse: rx="5" ry="10" cx="50" cy="50"`];
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
    return `<ellipse rx="${this.getRx()}" ry="${this.getRy()}"${this.getGlobalAttrs()}/>`;
  }
}

class PolygonRenderer extends PolyRenderer {
  constructor(
    allRenderers: QuizMdRenderers,
    rendererParams: RendererParams,
    childLines: string[] = []
  ) {
    super(allRenderers, rendererParams, childLines);
    this.name = "polygon";
    this.descShort = "polygon";
    this.descLong = "Draw a polygon";
    this.sample = [
      `polygon: points="0,0 60,0 60,90 20,90 20,50 0,50" x="100" y="100" fill="yellow" stroke-width="1" stoke="blue" nodes="A,B,C,D,E,F" lengths="6,9,4,4,2,5"`,
    ];
  }

  renderOpening(): string {
    return `<polygon${this.getGlobalAttrs()}/>${this.getNodeLabels()}${this.getEdgeLabels()}`;
  }
}

class PolylineRenderer extends PolyRenderer {
  constructor(
    allRenderers: QuizMdRenderers,
    rendererParams: RendererParams,
    childLines: string[] = []
  ) {
    super(allRenderers, rendererParams, childLines);
    this.name = "polyline";
    this.descShort = "polyline";
    this.descLong = "Draw a polyline";
    this.sample = [
      `polyline: points="0,0 60,0 60,90 20,90 20,50 0,50" x="100" y="100" fill="yellow" stroke-width="1" stoke="blue" nodes="A,B,C,D,E,F" lengths="6,9,4,4,2"`,
    ];
  }

  renderOpening(): string {
    return `<polyline${this.getGlobalAttrs()}/>${this.getNodeLabels()}${this.getEdgeLabels()}`;
  }
}

class GraphRenderer extends ShapeRenderer {}

class RectRenderer extends XyRenderer {
  constructor(
    allRenderers: QuizMdRenderers,
    rendererParams: RendererParams,
    childLines: string[] = []
  ) {
    super(allRenderers, rendererParams, childLines);
    this.name = "rect";
    this.descShort = "rectangle";
    this.descLong = "Draw a rectangle";
    this.sample = [`rect: width="100" height="50" x="0" y="0"`];
  }

  getWidth(): string {
    return (this.rendererParams["width"] as string) || "100";
  }

  getHeight(): string {
    return (this.rendererParams["height"] as string) || "50";
  }

  renderOpening(): string {
    return `<rect width="${this.getWidth()}" height="${this.getHeight()}"${this.getGlobalAttrs()}/>`;
  }
}

class RhombusRenderer extends CenteredRenderer {
  constructor(
    allRenderers: QuizMdRenderers,
    rendererParams: RendererParams,
    childLines: string[] = []
  ) {
    super(allRenderers, rendererParams, childLines);
    this.name = "rhombus";
    this.descShort = "rhombus";
    this.descLong = "Draw a rhombus";
    this.sample = [`rhombus p="5" q="10" cx="50" cy="50"`];
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
    return `<polygon points="${points}"${this.getGlobalAttrs(false)}/>`;
  }
}

class SquareRenderer extends XyRenderer {
  constructor(
    allRenderers: QuizMdRenderers,
    rendererParams: RendererParams,
    childLines: string[] = []
  ) {
    super(allRenderers, rendererParams, childLines);
    this.name = "square";
    this.descShort = "square";
    this.descLong = "Draw a square";
    this.sample = [`square: side="100" x="50" y="50"`];
  }

  getSide(): string {
    return (this.rendererParams["side"] as string) || "100";
  }

  renderOpening(): string {
    return `<rect width="${this.getSide()}" height="${this.getSide()}"${this.getGlobalAttrs()}/>`;
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
