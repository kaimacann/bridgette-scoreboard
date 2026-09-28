declare module 'react-simple-maps' {
	import type React from 'react';
	export type MapGeography = {
		rsmKey: string;
		geometry?: { type?: string };
		properties?: {
			name?: string;
			landuse?: string;
			description?: string;
			building?: string;
			highway?: string;
			aeroway?: string;
			natural?: string;
			waterway?: string;
			videos?: { src: string; title?: string }[];
		};
	};
	export const ComposableMap: React.ComponentType<React.PropsWithChildren<{ projection?: string; className?: string }>>;
	export const ZoomableGroup: React.ComponentType<React.PropsWithChildren<{ center?: [number, number]; zoom?: number; minZoom?: number; maxZoom?: number }>>;
	export const Geographies: React.ComponentType<{ geography: unknown; children: (props: { geographies: MapGeography[] }) => React.ReactNode }>;
	export const Geography: React.ComponentType<{ geography: MapGeography; className?: string; onClick?: () => void; key?: React.Key }>;
}
