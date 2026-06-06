---
title: "Why Your EV Shows 300 km at Night — But Only 190 km by Morning"
slug: why-your-ev-shows-300-km-at-night-but-only-190-km-by-morning
excerpt: "Temperature drops at night cause your battery's internal resistance to spike and the BMS to recalculate a conservative SoC — then morning load makes it even worse."
coverUrl: [SEARCH: electric vehicle range winter cold weather]
tags:
  - Battery Management
  - Range Anxiety
  - Thermal Effects
category: Deep Dive
readingTime: 11
published: true
pullQuote: "The battery doesn't lie about its energy. Your display does — because physics demands it."
tier: featured
---

# Why Your EV Shows 300 km at Night — But Only 190 km by Morning

It's 11 PM. You plug in. Full charge. The display reads 300 km.

You wake up at 6 AM, unlock the car, and see it.

**192 km.**

What happened? Did the car use power overnight? Is something wrong with the battery?

No. Your EV is fine. The battery is fine.

The problem is that cold weather makes lithium-ion batteries lie about their capacity — not by cheating, but by following the laws of thermodynamics.

[FIGURE]
src: https://upload.wikimedia.org/wikipedia/commons/7/79/Electrical_Resistance_Vs_Temperature.png
alt: Graph showing electrical resistance vs temperature curve for metals and semiconductors
caption: The graph shows how electrical resistance changes with temperature, illustrating the physics behind increased internal resistance in lithium-ion batteries at cold temperatures.
credit: Heike Kamerlingh Onnes
creditUrl: https://commons.wikimedia.org/wiki/File:Electrical_Resistance_Vs_Temperature.png
license: Public Domain
[/FIGURE]

## The Physics Nobody Talks About

Every lithium-ion cell has something called **internal resistance**. It's the resistance that current faces as it flows through the electrodes, the electrolyte, and the separator.

When this resistance is low, energy flows freely and the BMS can accurately estimate how much charge remains.

When this resistance is high, two things happen:

1. **Voltage sag under load** — The terminal voltage drops when you draw current
2. **Capacity appears lower** — The BMS interprets the lower voltage as lower SoC

[FIGURE]
src: https://upload.wikimedia.org/wikipedia/commons/f/f3/LIC-und-LI-Akku-Spannungsverlauf.png
alt: Comparison of charge and discharge voltage curves between lithium-ion batteries and lithium-ion capacitors
caption: Voltage discharge curves show how lithium-ion cells experience voltage sag at different temperatures, causing BMS to calculate lower remaining capacity.
credit: Elcap
creditUrl: https://commons.wikimedia.org/wiki/File:LIC-und-LI-Akku-Spannungsverlauf.png
license: CC0 1.0
[/FIGURE]

## Why Morning Is Worse

You might think the battery would warm up overnight while charging. And it does — partially.

But morning load — the HVAC system, seat heaters, the screen waking up — draws a high current pulse right when you start driving.

Cold resistance + high current = voltage sag = BMS sees "low voltage" = "low SoC."

[FIGURE]
src: https://upload.wikimedia.org/wikipedia/commons/6/6e/Schematic_of_a_Li-ion_battery.jpg
alt: Schematic diagram of a Lithium Ion Battery showing anode, cathode, separator, and electrolyte
caption: A simplified schematic of a Li-ion battery showing the core components that a BMS monitors and manages for SoC estimation.
credit: Materialsgrp
creditUrl: https://commons.wikimedia.org/wiki/File:Schematic_of_a_Li-ion_battery.jpg
license: CC BY-SA 4.0
[/FIGURE]

## What Your BMS Is Actually Doing

The Battery Management System doesn't measure capacity directly. It measures:

1. **Open Circuit Voltage (OCV)** — measured when the cell is at rest
2. **Terminal voltage under load** — measured during discharge
3. **Current flow** — integrated over time via Coulomb counting
4. **Cell temperature** — from embedded thermistors

The SoC algorithm uses all four inputs to estimate remaining charge. At cold temperatures, OCV-to-SoC lookup tables shift because the cell's voltage-electrochemistry relationship changes.

[FIGURE]
src: https://upload.wikimedia.org/wikipedia/commons/8/8e/IEC-60086--battery-code.svg
alt: Diagram of IEC 60086-1 standard for battery and cell identification and naming
caption: Standardized battery nomenclature and identification codes used in BMS hardware documentation and cell monitoring systems.
credit: Lead holder
creditUrl: https://commons.wikimedia.org/wiki/File:IEC-60086--battery-code.svg
license: CC BY-SA 4.0
[/FIGURE]

## What You Can Actually Do

If you live somewhere cold and experience this range drop:

1. **Precondition while plugged in** — Use grid power to warm the pack before driving
2. **Drive gently for the first 5 minutes** — Let the pack warm up under low load
3. **Set a higher buffer** — If you need 150 km, plan for 200 km in winter
4. **Use eco mode** — Reduces HVAC load and limits acceleration

The science is clear: cold makes batteries appear to have less energy. It's not a bug. It's thermodynamics.

---

*Want to calculate your actual winter range? Use the [EVPulse Range Estimator](/calculators/range-estimator).*