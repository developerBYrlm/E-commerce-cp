import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });

export default function MapView({ items = [] }) {
  const points = items.filter((item) => item.location?.coordinates?.length === 2 && (item.location.coordinates[0] || item.location.coordinates[1]));
  if (!points.length) return <div className="grid h-80 place-items-center rounded-3xl bg-slate-100 text-sm text-slate-500">Location pins appear when businesses share their coordinates.</div>;
  const first = points[0].location.coordinates;
  return <MapContainer center={[first[1], first[0]]} zoom={12} scrollWheelZoom={false} className="h-80 w-full rounded-3xl">
    <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    {points.map((item) => <Marker key={item._id} position={[item.location.coordinates[1], item.location.coordinates[0]]}><Popup>{item.name}</Popup></Marker>)}
  </MapContainer>;
}
