# Implementation Plan - BMP Aura and UI Consolidation

Consolidate aura effects for all Black Mitic Plus Pokémon and improve the World Map visual cues.

## User Review Required

> [!IMPORTANT]
> The current world map reference image is used for all continents. This plan will add visual filters (grayscale) to represent locked continents while maintaining the single background asset.

- **BMP Aura Consistency**: Ensure all `black_mitic_plus` Pokémon share the same purple aura effect across Team HUD, Collection, and Market.
- **World Map Cues**: Improve the "grayscale to color" transition on the world map to clearly show progress across Continents I, II, III, and IV.
- **UI Polish**: Minor adjustments to the bottom navigation to ensure "Salvar" and other icons are perfectly aligned.

## Technical Details

- **Aura Component**: Extract the aura logic into a reusable style or component if possible, or ensure the condition `rarity === 'black_mitic_plus'` triggers the purple drop-shadow/glow in all relevant mapping loops.
- **Map Filters**: Update the `filter` property on the `worldMapRefAsset` container based on `continentUnlocked` and `activeTab`.
- **Navigation Layout**: Adjust the flex-basis and padding of the navigation buttons to prevent text wrapping on smaller screens.
