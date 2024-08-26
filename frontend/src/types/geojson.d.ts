// src/geojson.d.ts

// this is a workaround
declare module '*.geojson' {
    const value: any;
    export default value;
}