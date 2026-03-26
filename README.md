# MedTrace
> Medication adherence platform for the 300M+ global diaspora

## The problem
- 50% of chronic disease patients don't take medications as prescribed
- 32M NRIs and 13M overseas Filipinos cannot monitor their parents' health from abroad
- $500B annual cost of non-adherence globally (WHO)

## Live demo
[Add Loom video link here]

## What's built
- Phone OTP authentication via Supabase
- Medicine cards with one-tap dose confirmation
- Offline-first streak tracking system
- Real-time guardian dashboard — family abroad sees green/amber/red status instantly
- Add Medicine screen with color picker and scheduling
- Supabase PostgreSQL backend with RLS security policies

## Tech stack
| Layer | Technology |
|---|---|
| Mobile/Web | React Native + Expo + TypeScript |
| Backend | Supabase (PostgreSQL + Auth + Realtime) |
| Local storage | AsyncStorage (offline-first) |
| Database | PostgreSQL with Row Level Security |
| Auth | Supabase Magic Link + Password |

## Architecture decisions
- **Offline-first:** dose confirmations save locally first, sync to cloud when connected
- **Real-time sync:** Supabase Realtime pushes dose log updates to guardian dashboard instantly
- **Security:** Row Level Security ensures users only access their own data

## Why I built this
My parents are in India. I am in Pennsylvania, USA. I wanted to know if they took their medicines today without calling them at 2am. So I built MedTrace.

## Built by
Trushna Patel — Senior Data Engineer, 7 years experience
Currently building MedTrace as a portfolio project demonstrating full-stack development with AI tools.
LinkedIn: https://www.linkedin.com/in/trushna4patel/
