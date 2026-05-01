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

[IMAGE_SEARCH]
lithium ion battery cold temperature internal resistance
The graph shows how internal resistance (IR) of a lithium-ion cell increases as temperature drops from 25°C to -10°C. Notice the steep rise below 10°C.
[/IMAGE_SEARCH]

## The Physics Nobody Talks About

Every lithium-ion cell has something called **internal resistance**. It's the resistance that current faces as it flows through the electrodes, the electrolyte, and the separator.

When this resistance is low, energy flows freely and the BMS can accurately estimate how much charge remains.

When this resistance is high, two things happen:

1. **Voltage sag under load** — The terminal voltage drops when you draw current
2. **Capacity appears lower** — The BMS interprets the lower voltage as lower SoC

[IMAGE_SEARCH]
voltage sag lithium ion battery discharge curve
A discharge curve showing how the voltage profile changes at different temperatures. At -20°C, the voltage sags significantly compared to 25°C, causing the BMS to calculate a lower remaining capacity.
[/IMAGE_SEARCH]

## Why Morning Is Worse

You might think the battery would warm up overnight while charging. And it does — partially.

But morning load — the HVAC system, seat heaters, the screen waking up — draws a high current pulse right when you start driving.

Cold resistance + high current = voltage sag = BMS sees "low voltage" = "low SoC."

[IMAGE_SEARCH]
battery management system SOC estimation algorithm
A simplified flowchart of how a BMS calculates State of Charge, showing the voltage measurement → OCV lookup → resistance compensation → final SoC display pipeline.
[/IMAGE_SEARCH]

## What Your BMS Is Actually Doing

The Battery Management System doesn't measure capacity directly. It measures:

1. **Open Circuit Voltage (OCV)** — measured when the cell is at rest
2. **Terminal voltage under load** — measured during discharge
3. **Current flow** — integrated over time via Coulomb counting
4. **Cell temperature** — from embedded thermistors

The SoC algorithm uses all four inputs to estimate remaining charge. At cold temperatures, OCV-to-SoC lookup tables shift because the cell's voltage-electrochemistry relationship changes.

[IMAGE_SEARCH]
electric vehicle BMS hardware module cell monitoring
A BMS PCB with a microcontroller, current sense resistor, and cell balancing circuits. The hardware that implements the algorithms discussed above.
[/IMAGE_SEARCH]

## What You Can Actually Do

If you live somewhere cold and experience this range drop:

1. **Precondition while plugged in** — Use grid power to warm the pack before driving
2. **Drive gently for the first 5 minutes** — Let the pack warm up under low load
3. **Set a higher buffer** — If you need 150 km, plan for 200 km in winter
4. **Use eco mode** — Reduces HVAC load and limits acceleration

The science is clear: cold makes batteries appear to have less energy. It's not a bug. It's thermodynamics.

---

*Want to calculate your actual winter range? Use the [EVPulse Range Estimator](/calculators/range-estimator).*