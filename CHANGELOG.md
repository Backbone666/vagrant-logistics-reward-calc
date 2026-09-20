# Changelog

## [1.1.0](https://github.com/Backbone666/vagrant-logistics-reward-calc/compare/v1.0.0...v1.1.0) (2026-09-20)


### Features

* **a11y:** add semantic name attributes and aria-atomic live region ([e6ea8a9](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/e6ea8a928617e617bce89581e542bf5f8fba6381))
* add external citations to FAQ page JSON-LD schema for GEO ([8d67c08](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/8d67c08d5f21bcb299040c0a28c3fec93045992d))
* add support for decimal inputs in Collateral and Volume fields ([a942e33](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/a942e33b528bee8009ad1074476ce3c21428fb9d))
* add URL query parameter synchronization and Quote copy template (Plan 018) ([b941cb9](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/b941cb963582a059925607e7c15a24eff2988338))
* align calculation engine with competitive rates, surcharges, and freighter limits ([07e1220](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/07e122074dde1e7b32833b2234ec904340ae4b26))
* **app:** add defensive bounds clamping and resilient url parameter handling ([395a59a](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/395a59a5da04c472d1b288a64480c55d867baaf2))
* dynamically display 'Distance Jump Fee' or 'Distance Cyno Fee' based on ship class ([2b3ef74](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/2b3ef747df3388105f030a8982d033869f1fc65a))
* frontend redesign, SEO, and LLM configuration ([fea9ac9](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/fea9ac91a471bb0c24b0e35fcc39107935163f82))
* Implement 'Shadow Class' DST pricing logic ([893ed22](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/893ed22da3da289814a6b84b2916fea799577315))
* implement competitive dangerous space pricing and high-risk modes ([0f0e066](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/0f0e06644f475aa81ee41d3a45c95fae599c7a9a))
* implement fallback config and UI warning banner for config fetch failures (Plan 015) ([a622b62](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/a622b62e9aacf860d8e2425c24dd69aaf4747836))
* integrate dynamic rate card config and courier calculator workflow ([3065e8b](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/3065e8bb8e4c18899325f4a4e428c2cab48bba6a))
* remove wormhole space and rush service options ([e7457a8](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/e7457a8a3dfd578c435267108bedad54085e7343))
* **route:** add real-time solar system autocomplete and progressive manual jump entry ([9879995](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/9879995f349b6723a1d0cb122c6d6c79c82b79b0))
* **route:** implement resilient multi-tier routing with native ccp esi fallback ([75cddb1](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/75cddb1015be38cf73c808cc721dfbc365a756ee))
* **route:** integrate eve tt routing engine with client-side cors gateway ([bb9f909](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/bb9f909ab736c30756f69b8907f89abd867b6190))
* **route:** serialize origin and destination in url params and decouple avoidance config ([663eb06](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/663eb06082e2866b57226e7ec9cc9c42b9063eb0))
* **routing:** integrate automated EVE Online route calculation engine ([36e97f4](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/36e97f4695f79d5c8931035bc9b99277de44de24))
* **seo:** enhance open graph metadata, json-ld structured data, and visible aeo faq ([e4d1281](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/e4d1281cfa8877b969b9015d9f0032326596e627))
* **typography:** implement fonttrio token architecture and tabular numeric layout ([91eba5f](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/91eba5f957daadd053e6be5a6e565edbe15261ab))
* **ux:** resilient clipboard api with legacy fallback and error feedback ([03e173b](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/03e173b4ac58eab7a50d90664f8dffe14c033583))
* Vagrant Logistics Rebrand & Rate Optimization ([#1](https://github.com/Backbone666/vagrant-logistics-reward-calc/issues/1)) ([817d854](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/817d8547805f505800a45415bc50b722a29c863f))


### Bug Fixes

* **app:** flush debounced url sync on quote copy and render cached config on startup ([31732d9](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/31732d9d7cf9e678dff7e900a181d1a2e167491f))
* **assets:** declare font binaries in gitattributes and regenerate woff2 without metadata drift ([c4ce5ca](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/c4ce5ca8f920458b38efabffeb5ce3617f78f348))
* **autocomplete:** ensure dropdown dismissal on selection and trigger route lookup only on confirmed systems ([8c9920c](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/8c9920c74dfdd3fdf1a327590a8864f7e53254a4))
* **calculator:** encapsulate metadata on error results and align fallback config ([f043ea8](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/f043ea8b9d95ba795e9bb87e86254d6f729f8c26))
* **ci:** remove llms.txt from asset check and advance version to 1.2.0 ([dfae831](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/dfae831ee130953da28abdd1256250c8bdc12c78))
* **dev:** add woff2 mime type and stream binary responses properly ([d5064df](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/d5064df00b9251da4828159cd2993b8f86559b10))
* guard bdDistanceLabel textContent changes with null check to handle cached index.html ([ee73474](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/ee73474b8f00321aa58938c2f6224fd1645fdb77))
* resolve Biome lint errors and configure VCS gitignore integration ([07e1f21](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/07e1f21e44cacb8d2d897ec2a360e43224768888))
* resolve live rate config loading error and webview history restrictions ([b072b11](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/b072b11602b9626d02e5fb2f86864caf6ca1892a))
* resolve mobile layout overflow and clipping issues ([88d3eb9](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/88d3eb93fd37da6e2d763dddc5d555ec612e0a9a))
* resolve warning banner CSS selector cascade collision ([cb2bfdb](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/cb2bfdb93d2265511e81effcdc81263b1212a912))
* Restore Freighter/JF pricing tiers while keeping Shadow Class DST logic ([df01bc1](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/df01bc1e761ca8de3f705b32053608d561f619a7))
* **route-service:** clean up abort listeners in combineSignals fallback ([1da260a](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/1da260a8ca2dc765d877e3f76621ec54154aa6c2))
* **route-service:** clean up fallback signal listeners on completion and neutralize disabled button hover ([84ba9a8](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/84ba9a80bb6d0bd6383af95a8442a315f2d227a7))
* **route:** filter origin and destination from avoid constraints and ensure combobox enter dismissal ([76b5c70](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/76b5c70bf65c139275e2019926da67fcb51589a6))
* **routing:** protect manual jump overrides and harden response error handling ([6378d5e](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/6378d5e19fca4ca1885b338ea1fefc0385dcfffd))


### Performance Improvements

* **app:** streamline jump parsing in updateAll ([f1dab4a](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/f1dab4aafe1e3460d19e5a1476d1308bf1b17632))
* batch DOM mutations in scheduleFrame and reuse cached lastDetails ([7ee2fb9](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/7ee2fb997a3a8b35b823472836a69d4a680d8d14))
* cache calcCard selector at startup ([ac0625f](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/ac0625fc9b205a2a849bc828eceac1954ccf0837))
* cap skip-link transition to &lt;=150ms using transition-smooth ([decd2a0](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/decd2a0eeba47bd6c550f24862aead2b748257f8))
* debounce URL parameter history updates ([71ea976](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/71ea9769a78d02be4480a0a6e62b1af0188dfa82))
* eliminate layout shift with explicit image dimensions and background aspect-ratio ([2fb9335](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/2fb933522f662418db819cbc2b83d5d5b75155b8))
* optimize background animations and memoize number formatting ([d301069](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/d3010695c5559cd0b47f23c147a5b7cf9961a434))
* optimize rendering and animations using CSS containment and RAF ([bf3328b](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/bf3328b5eaa93aef9f541e8ca72168fd5206693f))
* preload woff2 font asset in index.html ([21cd261](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/21cd261a148e8de29daa68550694781b8aacf052))
* prune unused and decorative keyframe blocks ([2f07988](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/2f07988b132248f14d63556fc777a5a8895f7a43))
* replace backdrop-filter and expensive shadows with solid composite ([064e3f4](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/064e3f47063025da19c560cb7d14f9de0bbcc652))
* retune transition token and remove ambient background animation ([aeebcc8](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/aeebcc88eab1ddf9f93232c3b12c05bc3f5de16c))

## 1.0.0 (2026-09-20)


### Features

* **a11y:** add semantic name attributes and aria-atomic live region ([e6ea8a9](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/e6ea8a928617e617bce89581e542bf5f8fba6381))
* add external citations to FAQ page JSON-LD schema for GEO ([8d67c08](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/8d67c08d5f21bcb299040c0a28c3fec93045992d))
* add support for decimal inputs in Collateral and Volume fields ([a942e33](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/a942e33b528bee8009ad1074476ce3c21428fb9d))
* add URL query parameter synchronization and Quote copy template (Plan 018) ([b941cb9](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/b941cb963582a059925607e7c15a24eff2988338))
* align calculation engine with competitive rates, surcharges, and freighter limits ([07e1220](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/07e122074dde1e7b32833b2234ec904340ae4b26))
* **app:** add defensive bounds clamping and resilient url parameter handling ([395a59a](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/395a59a5da04c472d1b288a64480c55d867baaf2))
* dynamically display 'Distance Jump Fee' or 'Distance Cyno Fee' based on ship class ([2b3ef74](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/2b3ef747df3388105f030a8982d033869f1fc65a))
* frontend redesign, SEO, and LLM configuration ([fea9ac9](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/fea9ac91a471bb0c24b0e35fcc39107935163f82))
* Implement 'Shadow Class' DST pricing logic ([893ed22](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/893ed22da3da289814a6b84b2916fea799577315))
* implement competitive dangerous space pricing and high-risk modes ([0f0e066](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/0f0e06644f475aa81ee41d3a45c95fae599c7a9a))
* implement fallback config and UI warning banner for config fetch failures (Plan 015) ([a622b62](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/a622b62e9aacf860d8e2425c24dd69aaf4747836))
* integrate dynamic rate card config and courier calculator workflow ([3065e8b](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/3065e8bb8e4c18899325f4a4e428c2cab48bba6a))
* remove wormhole space and rush service options ([e7457a8](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/e7457a8a3dfd578c435267108bedad54085e7343))
* **route:** add real-time solar system autocomplete and progressive manual jump entry ([9879995](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/9879995f349b6723a1d0cb122c6d6c79c82b79b0))
* **route:** implement resilient multi-tier routing with native ccp esi fallback ([75cddb1](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/75cddb1015be38cf73c808cc721dfbc365a756ee))
* **route:** integrate eve tt routing engine with client-side cors gateway ([bb9f909](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/bb9f909ab736c30756f69b8907f89abd867b6190))
* **route:** serialize origin and destination in url params and decouple avoidance config ([663eb06](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/663eb06082e2866b57226e7ec9cc9c42b9063eb0))
* **routing:** integrate automated EVE Online route calculation engine ([36e97f4](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/36e97f4695f79d5c8931035bc9b99277de44de24))
* **seo:** enhance open graph metadata, json-ld structured data, and visible aeo faq ([e4d1281](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/e4d1281cfa8877b969b9015d9f0032326596e627))
* **typography:** implement fonttrio token architecture and tabular numeric layout ([91eba5f](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/91eba5f957daadd053e6be5a6e565edbe15261ab))
* **ux:** resilient clipboard api with legacy fallback and error feedback ([03e173b](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/03e173b4ac58eab7a50d90664f8dffe14c033583))
* Vagrant Logistics Rebrand & Rate Optimization ([#1](https://github.com/Backbone666/vagrant-logistics-reward-calc/issues/1)) ([817d854](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/817d8547805f505800a45415bc50b722a29c863f))


### Bug Fixes

* **app:** flush debounced url sync on quote copy and render cached config on startup ([31732d9](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/31732d9d7cf9e678dff7e900a181d1a2e167491f))
* **assets:** declare font binaries in gitattributes and regenerate woff2 without metadata drift ([c4ce5ca](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/c4ce5ca8f920458b38efabffeb5ce3617f78f348))
* **autocomplete:** ensure dropdown dismissal on selection and trigger route lookup only on confirmed systems ([8c9920c](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/8c9920c74dfdd3fdf1a327590a8864f7e53254a4))
* **calculator:** encapsulate metadata on error results and align fallback config ([f043ea8](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/f043ea8b9d95ba795e9bb87e86254d6f729f8c26))
* **dev:** add woff2 mime type and stream binary responses properly ([d5064df](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/d5064df00b9251da4828159cd2993b8f86559b10))
* guard bdDistanceLabel textContent changes with null check to handle cached index.html ([ee73474](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/ee73474b8f00321aa58938c2f6224fd1645fdb77))
* resolve Biome lint errors and configure VCS gitignore integration ([07e1f21](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/07e1f21e44cacb8d2d897ec2a360e43224768888))
* resolve live rate config loading error and webview history restrictions ([b072b11](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/b072b11602b9626d02e5fb2f86864caf6ca1892a))
* resolve mobile layout overflow and clipping issues ([88d3eb9](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/88d3eb93fd37da6e2d763dddc5d555ec612e0a9a))
* resolve warning banner CSS selector cascade collision ([cb2bfdb](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/cb2bfdb93d2265511e81effcdc81263b1212a912))
* Restore Freighter/JF pricing tiers while keeping Shadow Class DST logic ([df01bc1](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/df01bc1e761ca8de3f705b32053608d561f619a7))
* **route-service:** clean up abort listeners in combineSignals fallback ([1da260a](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/1da260a8ca2dc765d877e3f76621ec54154aa6c2))
* **route-service:** clean up fallback signal listeners on completion and neutralize disabled button hover ([84ba9a8](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/84ba9a80bb6d0bd6383af95a8442a315f2d227a7))
* **routing:** protect manual jump overrides and harden response error handling ([6378d5e](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/6378d5e19fca4ca1885b338ea1fefc0385dcfffd))


### Performance Improvements

* **app:** streamline jump parsing in updateAll ([f1dab4a](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/f1dab4aafe1e3460d19e5a1476d1308bf1b17632))
* batch DOM mutations in scheduleFrame and reuse cached lastDetails ([7ee2fb9](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/7ee2fb997a3a8b35b823472836a69d4a680d8d14))
* cache calcCard selector at startup ([ac0625f](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/ac0625fc9b205a2a849bc828eceac1954ccf0837))
* cap skip-link transition to &lt;=150ms using transition-smooth ([decd2a0](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/decd2a0eeba47bd6c550f24862aead2b748257f8))
* debounce URL parameter history updates ([71ea976](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/71ea9769a78d02be4480a0a6e62b1af0188dfa82))
* eliminate layout shift with explicit image dimensions and background aspect-ratio ([2fb9335](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/2fb933522f662418db819cbc2b83d5d5b75155b8))
* optimize background animations and memoize number formatting ([d301069](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/d3010695c5559cd0b47f23c147a5b7cf9961a434))
* optimize rendering and animations using CSS containment and RAF ([bf3328b](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/bf3328b5eaa93aef9f541e8ca72168fd5206693f))
* preload woff2 font asset in index.html ([21cd261](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/21cd261a148e8de29daa68550694781b8aacf052))
* prune unused and decorative keyframe blocks ([2f07988](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/2f07988b132248f14d63556fc777a5a8895f7a43))
* replace backdrop-filter and expensive shadows with solid composite ([064e3f4](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/064e3f47063025da19c560cb7d14f9de0bbcc652))
* retune transition token and remove ambient background animation ([aeebcc8](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/aeebcc88eab1ddf9f93232c3b12c05bc3f5de16c))

## [1.1.0](https://github.com/Backbone666/vagrant-logistics-reward-calc/compare/v1.0.1...v1.1.0) (2026-09-20)


### Features

* **route:** add real-time solar system autocomplete and progressive manual jump entry ([2f362ca](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/2f362ca5aa3936e8b5384c9ef65b56c03b9e9771))
* **route:** integrate eve tt routing engine with client-side cors gateway ([c39f8f6](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/c39f8f6dff508dbdc481109b785a6d3b8c5197dc))
* **route:** serialize origin and destination in url params and decouple avoidance config ([49e4011](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/49e40118b0c01a1152e2d82a051920d67646dc1e))
* **typography:** implement fonttrio token architecture and tabular numeric layout ([7bc0471](https://github.com/Backbone666/vagrant-logistics-reward-calc/commit/7bc04712f7c1932f469e0e234cccb38163ecd35b))

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
