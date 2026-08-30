import type { StrategicMapView } from "../../../modules/strategy-northstar/application";
import { StrategicMindmap } from "./strategic-mindmap";

export function StrategicMap({ map }: { map: StrategicMapView }) {
  return <StrategicMindmap map={map} />;
}
