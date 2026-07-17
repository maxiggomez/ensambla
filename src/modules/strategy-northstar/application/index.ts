// Public interface of the strategy-northstar module (ADR-0002: cross-module
// access goes only through application/).
export { defineNorthStar, type DefineNorthStarInput } from "./define-north-star";
export { getNorthStar, type GetNorthStarInput, type NorthStarView } from "./get-north-star";
