# Alba asset credits

Download date: 2026-11-14.

These photographs were downloaded from Pexels and stored in the app. They are not loaded from the network at runtime. The [Pexels License](https://www.pexels.com/license/) allows free commercial use. Attribution is not required. Creator names were not shown on the downloaded file metadata, so the Pexels photo id is the credit.

Python-generated GIF thumbnails under `src/assets/wallpapers/thumbs/` are no longer the gallery source. The original small GIF files remain on disk so older saved alarm ids still resolve. They are not the new gallery.

| File | Pexels photo | Page | Used for |
| --- | --- | --- | --- |
| `src/assets/backgrounds/nature/forest-sunrise.jpg` | 3734875 | https://www.pexels.com/photo/3734875/ | Nature gallery, alarm background |
| `src/assets/backgrounds/nature/forest-stream.jpg` | 355321 | https://www.pexels.com/photo/355321/ | Nature gallery |
| `src/assets/backgrounds/nature/mountain-valley.jpg` | 1366919 | https://www.pexels.com/photo/1366919/ | Nature gallery |
| `src/assets/backgrounds/nature/golden-sunset.jpg` | 1032650 | https://www.pexels.com/photo/1032650/ | Nature gallery, ocean sunset |
| `src/assets/backgrounds/nature/moon-peaks.jpg` | 1287145 | https://www.pexels.com/photo/1287145/ | Minimal gallery |
| `src/assets/backgrounds/minimal/soft-field.jpg` | 1166209 | https://www.pexels.com/photo/1166209/ | Motivational gallery |
| `src/assets/backgrounds/night/lake-stars.jpg` | 1252869 | https://www.pexels.com/photo/1252869/ | Night gallery |
| `src/assets/backgrounds/night/starry-night.jpg` | 355465 | https://www.pexels.com/photo/355465/ | Night gallery |
| `flowers/sunflower.jpg` | 1366630 | https://www.pexels.com/photo/1366630/ | Flowers |
| `flowers/pink-bloom.jpg` | 931177 | https://www.pexels.com/photo/931177/ | Flowers |
| `mountains/ridge.jpg` | 417074 | https://www.pexels.com/photo/417074/ | Mountains |
| `minimal/fog.jpg` | 167699 | https://www.pexels.com/photo/167699/ | Minimal |
| `nature/waterfall.jpg` | 931018 | https://www.pexels.com/photo/931018/ | Nature, aerial coast |
| `abstract/sand.jpg` | 235615 | https://www.pexels.com/photo/235615/ | Abstract |
| `night/moon-sea.jpg` | 355288 | https://www.pexels.com/photo/355288/ | Abstract water |

Rejected after inspection:

- `pexels-photo-1421903` contained an Adobe Stock copyright string in EXIF. It was deleted and is not shipped.
- `pexels-photo-189349` was soft-focus and was deleted.
- `pexels-photo-531880` was an out-of-focus city and was deleted.

The home header illustration is original SVG in `src/features/alarm/DaypartHeader.tsx`. It is not a downloaded file.

No Lottie JSON was downloaded. The motion loops below are Mixkit footage, not generated sticker GIFs.

## Mixkit motion and sound, 2026-11-15

These files use the [Mixkit License](https://mixkit.co/license/#videoFree) (the pages label it “Free”, not “Mixkit Restricted License”). They can be used inside this app. They are not being resold as stock. Giphy and Tenor files are not included.

The GIF files are 2.4 second silent loops made from those videos so the alarm screen can show one animation without playing video audio over the alarm sound. The MP4 files are the original 720p downloads. Video preview starts muted.

| App file | Mixkit id | What it is |
| --- | --- | --- |
| `alba/gif/gif-sunset-city.gif` | 3983 | Sunset perspective in the city |
| `alba/gif/gif-sun-meadow.gif` | 40657 | Meadow in the sun |
| `alba/gif/gif-slow-river.gif` | 1218 | Raft on a slow river |
| `alba/gif/gif-stone-water.gif` | 2186 | Water over stones |
| `alba/gif/gif-alps.gif` | 4132 | Alps |
| `alba/gif/gif-dusk-city.gif` | 41375 | City at dusk |
| `alba/gif/gif-countryside.gif` | 4075 | Countryside meadow |
| `alba/gif/gif-park-run.gif` | 4831 | Park morning |
| `alba/gif/gif-city-train.gif` | 1606 | City train |
| `alba/gif/gif-city-side.gif` | 49846 | City at night |
| `alba/gif/gif-lava.gif` | 4426 | Lava sparks |
| `alba/gif/gif-flames.gif` | 52304 | Flames |
| `alba/gif/gif-ink-flow.gif` | 44818 | Dark ink |
| `alba/gif/gif-sunset-beach.gif` | 2168 | Sunset on the beach |
| `alba/gif/gif-sunset-sea.gif` | 4119 | Sunset from the sea |
| `alba/gif/gif-rain-lake.gif` | 18312 | Rain on a lake |
| `alba/gif/gif-waterfall.gif` | 572 | Waterfall |
| `alba/gif/gif-fireplace.gif` | 52284 | Flames |
| `alba/gif/gif-space-stars.gif` | 1610 | Stars |
| `alba/gif/gif-night-moon.gif` | 4433 | Moon in haze |
| `alba/video/mixkit-sunset-beach.mp4` | 2168 | Full video |
| `alba/video/mixkit-sunset-sea.mp4` | 4119 | Full video |
| `alba/video/mixkit-rain-lake.mp4` | 18312 | Full video |
| `alba/video/mixkit-waterfall.mp4` | 572 | Full video |
| `alba/video/mixkit-fireplace.mp4` | 52284 | Full video |
| `alba/video/mixkit-space-stars.mp4` | 1610 | Full video |
| `alba/video/mixkit-city-night.mp4` | 49845 | Full video |
| `alba/video/mixkit-night-moon.mp4` | 4433 | Full video |
| `alba/video/mixkit-forest-waterfall.mp4` | 2213 | Full video |
| `alba/video/mixkit-clouds-meadow.mp4` | 4070 | Full video |

New sounds in `res/raw`, Mixkit License, kept beside the older 55 files:

| File | Mixkit id | Title |
| --- | --- | --- |
| `alarm_mix_classic.wav` | 995 | Classic alarm |
| `alarm_mix_digital.wav` | 992 | Digital clock buzzer |
| `alarm_mix_morning.wav` | 1003 | Morning clock alarm |
| `alarm_mix_beep.wav` | 988 | Alarm clock beep |
| `alarm_mix_siren.wav` | 1008 | City alert siren |
| `alarm_mix_tone.wav` | 996 | Alarm tone |
| `alarm_mix_short.wav` | 993 | Classic short alarm |
| `alarm_mix_space.wav` | 1002 | Space shooter alarm |
| `alarm_mix_facility.wav` | 908 | Facility alarm |
| `alarm_mix_rooster.wav` | 2462 | Rooster crowing |
| `sleep_mix_light_rain_loop.wav` | rain page | Light rain loop |
| `sleep_mix_rain_and_thunder_storm.wav` | rain page | Rain and thunder storm |
| `sleep_mix_sea_waves_with_birds_loop.wav` | ocean page | Sea waves with birds |
| `sleep_mix_forest_birds.wav` | forest page | Little birds singing in the trees |

Two downloaded sleep files were removed before shipping: “Air zoom vacuum” and “Wolves at scary forest”. They were not sleep sounds. Mixkit Restricted License videos were not kept.
