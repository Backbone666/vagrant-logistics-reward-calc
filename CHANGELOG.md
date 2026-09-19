# Changelog

## [1.0.1](https://github.com/Backbone666/vagrant-logistics-reward-calc/compare/v1.0.0...v1.0.1) (2026-09-19)


### Bug Fixes

* **route-service:** clean up abort listeners in combineSignals fallback ([e5a5fb2](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/e5a5fb275c30c9ff348df993bd2ee638e912642f))
* **route-service:** clean up fallback signal listeners on completion and neutralize disabled button hover ([e5c9062](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/e5c9062dc605d3bb8999e4e8d7f9041457b166d5))


### Performance Improvements

* **app:** streamline jump parsing in updateAll ([57e7676](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/57e7676c7a43ae0976e393d805c2192cab985c9c))

## 1.0.0 (2026-09-19)


### Features

* **a11y:** add semantic name attributes and aria-atomic live region ([58f5fd8](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/58f5fd860c15c39cd75ff837f2ded43465d01115))
* add external citations to FAQ page JSON-LD schema for GEO ([3ae089d](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/3ae089dc1ff1fb799abec94bb40998cc2539b9db))
* add support for decimal inputs in Collateral and Volume fields ([e4b02da](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/e4b02da21490f429319ba3da0dfd8a0e0b5767bd))
* add URL query parameter synchronization and Quote copy template (Plan 018) ([6728f9a](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/6728f9a180d36b9c39eb4b2549de5933f1d035c1))
* align calculation engine with competitive rates, surcharges, and freighter limits ([98d2053](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/98d2053660e371f37ae7b4c69127c1595d7fc663))
* dynamically display 'Distance Jump Fee' or 'Distance Cyno Fee' based on ship class ([126a3fb](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/126a3fb1258be185776ae8d3aaa0a937f7a0301d))
* frontend redesign, SEO, and LLM configuration ([dbb6aeb](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/dbb6aeb92a273c376b99a76c81db696db66bb8e5))
* Implement 'Shadow Class' DST pricing logic ([bf7def0](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/bf7def0e5a4d8bd57134ab8ef192eba7e2f51bed))
* implement competitive dangerous space pricing and high-risk modes ([a34659c](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/a34659cdf99d30193603d7b69f6e90a12f099db8))
* implement fallback config and UI warning banner for config fetch failures (Plan 015) ([33fbf8b](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/33fbf8b9ef3995ef146e538a39cd8d2c3acb0fa0))
* integrate dynamic rate card config and courier calculator workflow ([ad21610](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/ad21610e5e7e1061de92d1c951c674a43f8a5c46))
* remove wormhole space and rush service options ([fe12355](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/fe1235596b328ed6f7e8849aa8deafdf015e5cee))
* **ux:** resilient clipboard api with legacy fallback and error feedback ([d91b77e](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/d91b77e96cef79c87ee5b2151b657af96d45d713))
* Vagrant Logistics Rebrand & Rate Optimization ([#1](https://github.com/Backbone666/vagrant-logistics-reward-calc/issues/1)) ([789aaf4](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/789aaf4b7637ff5b83fdc642facb041915eb4f67))


### Bug Fixes

* **app:** flush debounced url sync on quote copy and render cached config on startup ([a6493b5](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/a6493b56e0431cffdd46af4c50a6250ecdde6c54))
* **assets:** declare font binaries in gitattributes and regenerate woff2 without metadata drift ([2d63726](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/2d637261f9fe67b0083cbb872bd4834a951a1065))
* **calculator:** encapsulate metadata on error results and align fallback config ([42fc986](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/42fc986f1b913ed1889132a94a0fe499939a9e00))
* **dev:** add woff2 mime type and stream binary responses properly ([e243e49](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/e243e4939f57041720ce92859f902295d1530a06))
* guard bdDistanceLabel textContent changes with null check to handle cached index.html ([615ca8f](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/615ca8fa60c6a0d6d140363e706eb140b31bb6db))
* resolve Biome lint errors and configure VCS gitignore integration ([f8534ec](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/f8534ecefd2d861da35df080ce4dd4a34edd83a1))
* resolve live rate config loading error and webview history restrictions ([f8ea05a](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/f8ea05a211b78950ad4cf7a12a5d083228d9ebae))
* resolve mobile layout overflow and clipping issues ([fdf0bbe](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/fdf0bbed8fab6801d24cd9af40f301e62e503c5b))
* resolve warning banner CSS selector cascade collision ([8192248](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/819224807b2f91a7fd4fe66a8de64461fced6295))
* Restore Freighter/JF pricing tiers while keeping Shadow Class DST logic ([930fe1d](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/930fe1d3d1fa51277905e51ce3021d3191a8500b))


### Performance Improvements

* batch DOM mutations in scheduleFrame and reuse cached lastDetails ([84d6e27](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/84d6e27bde3c25f177c1f18e53631784616bffd8))
* cache calcCard selector at startup ([14491de](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/14491dec2b86770fec70e23e8bf9391145cbd2d7))
* cap skip-link transition to &lt;=150ms using transition-smooth ([62eefe5](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/62eefe5f13f3deeb77f62dc26bb7fb16c1f07cd8))
* debounce URL parameter history updates ([067ce33](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/067ce33530b19f398a103e6f8eb10a1e93bcd4d0))
* eliminate layout shift with explicit image dimensions and background aspect-ratio ([1c70583](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/1c70583305c0514ebb6cd0f5473eb19a655ba680))
* optimize background animations and memoize number formatting ([d9afc04](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/d9afc04427efa2a24ee355814a74230349e8294b))
* optimize rendering and animations using CSS containment and RAF ([690f018](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/690f018773a275af3a3d5e08af90a3884d9fbf63))
* preload woff2 font asset in index.html ([66c6c6f](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/66c6c6f8d589c46c1f7059fbf6bf9222fb863934))
* prune unused and decorative keyframe blocks ([6145773](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/6145773a4047a14622ff1b97841288bd59739a27))
* replace backdrop-filter and expensive shadows with solid composite ([b826b12](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/b826b121687873f9507b21f52c3d165ea4e8068f))
* retune transition token and remove ambient background animation ([1dcaa01](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/1dcaa01e73afb1767d1a970e207bc2d7ea55b14d))
