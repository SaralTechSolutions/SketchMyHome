/** Staircase + wall frame: polygon footprint edited like site boundary. */
export const POLYGON_FOOTPRINT_SUBTYPES = ['staircase', 'frame'];

export function isPolygonFootprintObject(item) {
    return (
        item &&
        item.type === 'object' &&
        POLYGON_FOOTPRINT_SUBTYPES.includes(item.subType) &&
        item.points &&
        item.points.length >= 3
    );
}
