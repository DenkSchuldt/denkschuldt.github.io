
/**
 * index.js
 * Geopanos actions
 *
 * @author  Denny K. Schuldt
 *
 */

const createAction = (type, payload = undefined) => (
  payload ? { type, payload } : { type }
)

export const types = {
  UPDATE_GEOPANOS_DATA: "UPDATE_GEOPANOS_DATA",
  LOAD_GEOPANOS: "LOAD_GEOPANOS",
  PREVIOUS_GEOPANO: "PREVIOUS_GEOPANO",
  NEXT_GEOPANO: "NEXT_GEOPANO"
}

export const actions = {
  updateGeoPanosData: (payload) => createAction(types.UPDATE_GEOPANOS_DATA, payload),
  loadGeoPanos: () => createAction(types.LOAD_GEOPANOS),
  previousGeoPano: () => createAction(types.PREVIOUS_GEOPANO),
  nextGeoPano: () => createAction(types.NEXT_GEOPANO)
}
