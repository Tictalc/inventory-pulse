# Inventory Pulse

PROJECT: Lenskart Inventory Copilot — P0 Prototype

1. PRODUCT CONTEXT

Build a polished working prototype called Inventory Copilot for Lenskart.

This is NOT intended to replace Lenskart's existing replenishment system.

The product is an intelligence + orchestration layer on top of replenishment that helps supply-chain/store teams proactively identify inventory risks and decide the best source of inventory.

Core product principle:

Before creating new replenishment demand, first check whether inventory already exists somewhere closer to the demand.

The system should make store and warehouse operations easier by proactively detecting demand changes, identifying inventory imbalance, recommending the best source, and allowing the user to execute the action.

The prototype should focus on best-selling products across:

Frames

Sunglasses

Lenses

We will use clearly labelled synthetic/demo data. Do not imply that any displayed numbers are real Lenskart data.

2. CORE PRODUCT LOOP

The entire experience should revolve around:

SENSE → DETECT → SOURCE → ACT → RE-CALCULATE

SENSE

Monitor:

Recent sales velocity

Historical demand pattern

Day-of-week effects

Seasonality

Current inventory

In-transit inventory

Nearby store inventory

Warehouse inventory

Synthetic real-time store/customer demand signals

DETECT

Identify:

Demand acceleration

Potential stockout

Inventory imbalance

Best-seller at risk

Excess inventory sitting in another location

SOURCE

Use this priority:

Current store inventory

Another store in the same city

Warehouse

Exception / supply constraint

ACT

Recommend and allow execution of:

Inter-store transfer

Warehouse replenishment

No action

Exception/escalation

RE-CALCULATE

After an action is executed, inventory numbers and days-of-cover should update immediately and the recommendation should recalculate.

This state change is important. The prototype must feel like a real operational product, not a static dashboard.

3. P0 SCOPE — DO NOT BUILD MORE THAN THIS

The prototype only needs these 4 primary experiences:

A. Network Control Tower

High-level inventory health across:

India

City

Store

We only need meaningful synthetic data for one city: Bangalore, with 3–5 stores.

Other cities can appear as summary/demo data only.

B. Best Seller Radar

Show best-selling SKUs across:

Frames

Sunglasses

Lenses

Highlight proactive demand signals and inventory risks.

C. Opportunity / Recommendation Detail

When a user selects an item, show:

Demand signal

Current inventory

Days of cover

Expected demand

Nearby inventory

Warehouse inventory

Recommended source

Recommended quantity

Reasoning

Confidence

Alternative considered

D. Execute Action

Allow the user to:

Execute inter-store transfer

Execute warehouse replenishment

Dismiss/acknowledge recommendation

After execution, update inventory and visibly show the impact.

4. HERO USE CASES

The prototype MUST support these three scenarios.

USE CASE 1 — CITY REBALANCING

Example:

SKU: Best-selling Sunglasses A

Koramangala:

Low inventory

Demand accelerating

~2 days of cover

Indiranagar:

High inventory

~13 days of cover

System recommendation:

Transfer 20 units from Indiranagar → Koramangala

Reason:

Koramangala demand is accelerating while Indiranagar has sufficient excess inventory. Rebalancing locally avoids an unnecessary warehouse pull.

Button:

Execute Transfer

After execution:

Reduce Indiranagar inventory

Increase Koramangala inventory

Recalculate days of cover

Show “Warehouse Pull Avoided”

USE CASE 2 — NO LOCAL STOCK → WAREHOUSE

Example:

SKU: Best-selling Frame B

Koramangala:

High demand

~1.5 days of cover

All Bangalore stores:

No suitable excess inventory

Warehouse:

Inventory available

System recommendation:

Replenish 30 units from Warehouse → Koramangala

Reason:

No suitable city-level inventory is available. Warehouse inventory is the next available source.

Button:

Execute Warehouse Replenishment

After execution:

Update store inventory

Update warehouse inventory

Recalculate days of cover

Show expected arrival/status

USE CASE 3 — SUPPLY CONSTRAINT

Example:

SKU: Best-selling Lens C

Koramangala:

Demand increasing

Low inventory

Bangalore stores:

No transferable inventory

Warehouse:

0 available

System should NOT invent a solution.

Show:

Supply Constraint Detected

And:

Demand exists, but inventory is unavailable across the current network.

Action:

Escalate / Flag

This is important: the system should recognize when optimization cannot solve the problem.

5. PROACTIVE SIGNALS

Do NOT make this a simple “inventory below threshold” dashboard.

The system should surface proactive signals such as:

Demand Surge

Recent sales velocity is materially higher than the previous period.

Stockout Risk

Expected demand during the relevant replenishment period exceeds available inventory.

Network Imbalance

One store is running low while another store has significantly more inventory than expected demand.

Warehouse Dependency

A store requires replenishment but no suitable local inventory exists.

Supply Constraint

Demand exists but inventory is unavailable across stores and warehouse.

Use simple transparent synthetic rules rather than building a real ML model.

The UI should communicate that these are prototype decision rules, not production ML.

6. RECOMMENDATION LOGIC

Use an explainable decision engine.

Conceptually:

IF store inventory comfortably covers expected demand:
→ NO ACTION

ELSE IF another store in the SAME CITY has suitable excess inventory:
→ RECOMMEND INTER-STORE TRANSFER

ELSE IF warehouse has inventory:
→ RECOMMEND WAREHOUSE REPLENISHMENT

ELSE:
→ SUPPLY CONSTRAINT / ESCALATE

When multiple stores could supply the item, prefer the source that minimizes unnecessary inventory movement while still protecting the source store's own demand.

The system should consider:

Source store days of cover

Destination store days of cover

Demand acceleration

Transfer quantity

Warehouse availability

Do not build complex optimization algorithms for P0.

7. KEY METRICS

Do NOT overload the UI with generic supply-chain KPIs.

Use these three:

Right-Place Inventory

Percentage of best-seller inventory positioned in locations where demand is expected.

Avoided Warehouse Pulls

Number of replenishment actions satisfied through existing city inventory instead of warehouse inventory.

Human Intervention Rate

Percentage of recommendations requiring manual intervention.

Also show contextual impact after each action, for example:

2.1 → 7.3 days of cover

and:

Warehouse pull avoided

Use synthetic values and clearly label them as demo metrics.

8. HERO DASHBOARD

Create a modern operations control tower.

Header:

Inventory Copilot

Subtitle:

Network-aware replenishment intelligence

Top navigation:

Overview

Best Sellers

Opportunities

Activity

Top-level selector:

India / Bangalore / Store

Main KPI cards:

Best Sellers at Risk

Demand Signals

Network Opportunities

Avoided Warehouse Pulls

Main section:

PRIORITY OPPORTUNITIES

Cards/table showing:

SKU | Category | Store | Signal | Cover | Recommended Action

Example:

Aviator X | Sunglasses | Koramangala | 🔥 Demand Surge | 2.1 days | Transfer from Indiranagar

9. HERO DETAIL EXPERIENCE

Clicking an opportunity should open a responsive side panel or modal.

Use a polished responsive pop-up / command-center drawer, not a page reload.

The detail panel should contain:

SKU

Product name + category

Demand Pulse

Show a simple mini-chart:

Previous demand → Current demand

Example:

42 units → 67 units

Inventory Position

Destination:

Current stock

Days of cover

Expected demand

Potential source:

Available stock

Days of cover after transfer

Warehouse:

Available stock

Recommended Action

Large prominent card:

TRANSFER 20 UNITS

Indiranagar → Koramangala

WHY?

Show 2–4 concise reasons:

Demand increased

Destination has low cover

Source has excess cover

Warehouse pull can be avoided

SOURCE DECISION

Visually show:

Store → City Store → Warehouse → Exception

Highlight the selected source.

Confidence

Use:

High

Medium

Low

Do NOT imply this is a real ML confidence score. Label it as:

Prototype confidence

Primary CTA:

Execute Transfer

Secondary:

Dismiss

10. EXECUTION EXPERIENCE

When the user clicks Execute:

Do NOT simply change the number.

Show a polished confirmation modal:

Confirm inventory transfer

20 units

Indiranagar → Koramangala

Koramangala cover:
2.1 → 7.3 days

Indiranagar cover:
13.4 → 8.2 days

Warehouse pull avoided

Buttons:

Confirm & Execute

Cancel

After confirmation:

Show a short success state:

✓ Transfer executed

Then update the dashboard immediately.

Show:

Inventory recalculated

This should feel seamless.

11. VISUAL DESIGN

Create a premium modern enterprise product.

Design direction:

Dark purple primary theme

Deep purple / near-black background

Subtle purple gradients

White/off-white typography

Purple/lavender highlights

Minimal use of bright colors only for semantic status

Rounded cards

Soft borders

Subtle shadows/glows

Clean data visualization

High information density without looking cluttered

Suggested visual mood:

Modern AI operations control tower + premium fintech dashboard

Do NOT make it look like a generic admin template.

Do NOT overuse gradients.

Do NOT use huge hero marketing sections.

This is an operational application.

Use:

Tailwind CSS

shadcn/ui

Lucide icons

Responsive layouts

Accessible components

Use standard Tailwind breakpoints.

12. RESPONSIVENESS

The app must work well on:

Desktop

Laptop

Tablet

Mobile

On smaller screens:

Tables become cards

Side panels become full-screen/bottom sheets

KPI cards stack

Navigation becomes compact

Use responsive pop-ups/drawers for detail views.

13. DATA

Use synthetic data.

Create realistic demo data for:

City

Bangalore

Stores

Koramangala

Indiranagar

Whitefield

HSR

Jayanagar

Categories

Frames

Sunglasses

Lenses

Create around 15–30 best-selling SKUs.

Each SKU should have:

SKU ID

Product name

Category

Store

Current inventory

Historical daily sales

Recent daily sales

Expected demand

Days of cover

Warehouse inventory

In-transit quantity

Demand signal

Source recommendation

Recommendation status

Make the demo data deliberately create the three hero scenarios:

City transfer

Warehouse replenishment

Supply constraint

Do NOT use random numbers that produce inconsistent recommendations.

14. STATE MANAGEMENT

P0 must have real interactive state.

When an action executes:

Inter-store transfer:

Source inventory decreases

Destination inventory increases

Days of cover update

Opportunity status changes to resolved

Activity log updates

Warehouse replenishment:

Warehouse inventory decreases

Destination inventory increases

Opportunity status changes to resolved

Activity log updates

Supply constraint:

No inventory is magically created

Status changes to escalated

Persist state during the current session.

Do not add authentication for P0.

Do not add real external APIs.

Do not add payment, email, notifications, or unnecessary integrations.

15. ACTIVITY FEED

Add a lightweight activity panel:

Recent Actions

✓ 20 units transferred
Indiranagar → Koramangala

✓ 30 units replenished
Warehouse → Koramangala

⚠ Supply constraint flagged
Lens C / Jayanagar

This helps demonstrate that the system is actually operational.

16. IMPORTANT PRODUCT LANGUAGE

Avoid saying:

“AI predicts everything.”

Instead use:

Demand Signal

Inventory Intelligence

Network Opportunity

Recommended Source

Decision Reason

Prototype Confidence

Auto / Assisted Action

The product should feel intelligent without pretending that we built production-grade AI.

17. P0 EXCLUSIONS

Do NOT build:

Real ML forecasting

Real Lenskart integrations

Authentication

ERP/WMS integration

Complex optimization solver

Supplier management

Procurement workflows

Full India dataset

Advanced user permissions

Complex analytics pages

Mobile app

Notifications

Chatbot

Generic AI assistant

These are explicitly out of scope for P0.

The objective is a working, convincing product prototype for a 15-minute interview demo.

18. DEMO FLOW

The prototype should make this flow extremely easy:

Open Overview

Show Bangalore network

Open Best Seller Radar

Select a demand surge

Show Koramangala stock risk

Show Indiranagar has excess

Recommend transfer

Execute transfer

Show inventory recalculated

Open another opportunity

Show no local inventory

Recommend warehouse replenishment

Execute

Show supply constraint example

The entire demo should be possible without navigating through complicated menus.

19. ENGINEERING GUIDELINES

Build the simplest maintainable implementation possible.

Prioritize:

Working interactions

Correct inventory state transitions

Clear recommendation logic

Excellent UX

Visual polish

Do not over-engineer.

Use reusable components for:

KPI cards

Status badges

Inventory cards

Opportunity cards

Recommendation drawer

Confirmation modal

Activity feed

Keep business logic separate from UI components where practical.

20. CRITICAL CONSTRAINT

This is a P0 prototype with limited development time and limited Lovable credits.

Do not build beyond the requested scope.

If something is ambiguous, choose the simplest implementation that supports the demo.

Do not add features just because they are technically interesting.

The product should feel focused, premium, intelligent and operational, not feature-heavy.

21. FIRST IMPLEMENTATION TASK

Start by building the P0 application with:

Responsive shell/navigation

Overview dashboard

Synthetic Bangalore data

Best Seller Radar

Opportunity detail drawer

Recommendation engine

Inter-store transfer flow

Warehouse replenishment flow

Supply constraint flow

Inventory state updates

Activity feed

Before adding anything outside this scope, prioritize making these flows fully functional.

After implementation, verify that all three demo scenarios work end-to-end without inconsistent inventory calculations.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/fced74e6-9441-4efd-b7b4-348507efcf8b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
