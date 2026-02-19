# Modern UI Design Guidelines: Privet AI

**Version 1.0 (Draft)**  
**Author:** AI Product Design Lead  
**Last Updated:** 2026-02-19

---

## 0. Introduction & Prime Directive
This document serves as the single source of truth for the UI/UX of **Privet AI**, an AI-powered Russian learning application.

**Prime Directive:**  
All design decisions must support the core pedagogical loop: **Teach → Drill → Recall → Use → Review**.  
The interface should be **invisible** when the user is learning, and **delightful** when they are celebrating progress.

---

## 1. Design Principles

1.  **Clarity Over Style (Function First)**
    *   **Definition:** The learning content is the hero. The UI frame exists to support it, not compete with it.
    *   **UI Implication:** High contrast text, minimal decorative elements during lessons, clear hierarchy. No distractions during the "Teach" or "Drill" phases.

2.  **Cyrillic Integrity**
    *   **Definition:** respect the Russian language's visual and structural distinctiveness.
    *   **UI Implication:** **NO ITALICS** for Cyrillic text. Ever. Use weight (Bold), colour, or background highlights for emphasis. Ensure line heights accommodate Cyrillic ascenders/descenders.

3.  **Encouraging & Forgiving**
    *   **Definition:** Learning a language is hard. The UI should be a supportive coach.
    *   **UI Implication:** Error messages should be helpful, not punitive. Use soft transitions for corrections. Celebrate small wins (streaks, correct answers) with visual flair (sparks, haptics).

4.  **Native & Distinct (The "Privet" Vibe)**
    *   **Definition:** Reflecting modern Russia without falling into stereotypes (no nesting dolls or bears unless ironic).
    *   **UI Implication:** Use the specific blue/red/white palette derived from the flag but applied in a modern, clean tech aesthetic.

5.  **Predictability**
    *   **Definition:** Users should never guess "what happens if I click this?".
    *   **UI Implication:** Consistent button placements (Primary action always bottom right or full width), standard icons for audio, clear navigation states.

---

## 2. Visual System

### 2.1 Color Palette
**CRITICAL:** These hex codes are ANCHORS. Do not change them.

| Role | Color Name | Hex | Usage |
| :--- | :--- | :--- | :--- |
| **Brand Primary** | **Primary Blue** | `#0036A7` | Main buttons, active states, key icons, wordmark. |
| **Brand Accent** | **Primary Red** | `#D62718` | "Spark" moments, critical errors, call-to-action accents. Use sparingly. |
| **Brand Surface** | **Primary White** | `#FFFFFF` | Main background, cards on dark mode. |
| **Brand Secondary** | **Secondary Blue** | `#2D5CB9` | Hover states for primary, illustrated backgrounds, decorative shapes. |
| **Background** | **Neutral Light** | `#F5F7FA` | App background (light mode). |
| **Text Primary** | **Neutral Dark** | `#1D1D1B` | Primary text, headings, icons on light backgrounds. |
| **Info/Notification** | **Accent Teal** | `#2DA1C3` | Success states, informational tooltips, neutral highlights. |

#### Color Usage Rules
*   **Text on Blue:** Always use `#FFFFFF` (White).
*   **Text on Red:** Always use `#FFFFFF` (White).
*   **Errors:** Use `#D62718` (Red) for error text/icons, but consider a softer red background (`#FDEDEC`) for error banners to reduce alarm.
*   **Accessibility:** All text must meet WCAG AA contrast ratios. If an anchor color fails on a specific background, use the **Exception** rule to adjust brightness slightly while maintaining hue.

### 2.2 Typography
**Primary Font Stack:** `Inter`, `Roboto`, or system-native sans-serif that supports Cyrillic well.

**CRITICAL RULE: NO ITALICS for Cyrillic.**
*   **Emphasis:** Use **Bold (600/700)**, <span style="color:#0036A7">Color</span>, or <u>Underline</u>.
*   **Reasoning:** Russian italics (coursive) look significantly different from standard upright forms and can confuse learners.

| Style | Size (rem/px) | Weight | Line Height | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **H1 (Large)** | 2.0 / 32px | 700 (Bold) | 1.2 | Main/Hero headers (e.g., "Unit Complete") |
| **H2 (Section)** | 1.5 / 24px | 600 (Semi) | 1.3 | Lesson titles, Modal headers |
| **H3 (Label)** | 1.25 / 20px | 600 (Semi) | 1.4 | Card titles, subsection headers |
| **Body (Main)** | 1.0 / 16px | 400 (Reg) | 1.5 | Standard reading text, instructions |
| **Body (Strong)**| 1.0 / 16px | 600 (Semi) | 1.5 | Emphasised text within body |
| **Caption** | 0.875 / 14px | 400 (Reg) | 1.4 | Hints, metadata, timestamps |
| **Tiny** | 0.75 / 12px | 500 (Med) | 1.2 | Badges, small labels |

### 2.3 Iconography
*   **Style:** Filled or thick-stroke (2px) outlines. Rounded corners. Simple geometry.
*   **Cyrillic Context:** Ensure icons (like "Translate", "Keyboard") imply Cyrillic or dual-language context (e.g., "RU" badge).
*   **Audio Icons:**
    *   **Speaker:** Play audio (normal speed).
    *   **Snail / Turtle:** Play audio (slow).
    *   **Microphone:** Record asking for input.
    *   **Waveform:** Audio playing active state.

### 2.4 Layout & Spacing
*   **Grid:** 8pt base grid. All spacing/margins should be multiples of 8 (8, 16, 24, 32, 48).
*   **Touch Targets:** Minimum 44x44pt click area for all interactive elements.
*   **Border Radius:**
    *   **Buttons:** 8px or Pill (fully rounded).
    *   **Cards:** 12px or 16px.
    *   **Inputs:** 8px.

---

## 3. Component Library Hints

### 3.1 Buttons
*   **Primary:** `#0036A7` background, `#FFFFFF` text. Pill shape.
*   **Secondary:** Translucent Blue or Outline (`#0036A7` border).
*   **Destructive:** Transparent with `#D62718` text, or White with Red border.
*   **Fab/Action:** Floating circle, usually Primary Blue with a simplified icon (e.g., "Play").

### 3.2 Cards (Lesson Learning)
*   **Structure:**
    *   Container: White (`#FFFFFF`) with subtle shadow (Elevation 1) and 16px radius.
    *   Header: Title + Audio icon.
    *   Body: The core content (Vocab word, Sentence). Centered alignment often works best for single-word focus.
    *   Footer: hints or secondary actions.

### 3.3 Inputs (Learning)
*   **Text Field:**
    *   Default: `#F5F7FA` background, `#1D1D1B` text. Bottom border or full outline.
    *   Active/Focus: `#0036A7` border.
    *   Error: `#D62718` border + shake animation.
    *   **Russian Input:** Even if the system keyboard is EN, the input should intuitively handle or suggest Cyrillic if a custom keyboard isn't used.

### 3.4 Feedback States (The "Closed Loop")
*   **Correct:**
    *   Color: Green (Success) or Primary Blue (`#0036A7`) + sound effect.
    *   Motion: A subtle "pop" or checkmark animation.
    *   Message: "Correct!", "Otlichno!", "Molodets!"
*   **Incorrect:**
    *   Color: `#D62718` / light red background.
    *   **Crucial:** Show the *Correct Answer* immediately below.
    *   Action: "Got it" button to acknowledge and move on.

---

## 4. Key Screens & Flows

### 4.1 Lesson Flow (The Core Loop)
1.  **Teach:** Clean card, large Cyrillic text, smaller translation. Auto-play audio. "Next" button.
2.  **Drill:** Multiple choice or matching. Fast interaction.
3.  **Recall:** Typing or speaking prompt. Empty state > Typing > Validate.
4.  **Use:** Short dialogue or sentence context.
5.  **Review:** Summary screen. "Lesson Complete". Progress ring fills up.

### 4.2 Home Dashboard
*   **Header:** User streak (Fire icon + count), Level (A1), Profile.
*   **Main Path:** Vertical scrolling path or list of unlocked units. Text should be clear (e.g., "Unit 1: Basics").
*   **FAB:** "Practice Review" or "Start Next Lesson" (Primary Action).

### 4.3 Settings / Audio
*   **Narration Toggle:** Clearly visible "Narration: ON/OFF" switch.
    *   ON: "Teacher" voice guides you.
    *   OFF: Click-to-hear only (for silent environments).

---

## 5. Learning Patterns (Specific to Russian)

### 5.1 Transliteration & Stress
*   **Stress Marks:** PRIMARY importance.
    *   Visual: Acute accent ( ́ ) over the stressed vowel (e.g., *приве́т*).
    *   Color: Optionally highlight the stressed vowel in a subtle distinct color (e.g., Primary Red) in "Teach" mode.
*   **Transliteration:**
    *   **Ghost Text:** Display smaller, lighter (grey), below the Cyrillic.
    *   **Progressive Disclosure:** Tap-to-reveal or global setting to hide after Week 1.

### 5.2 Grammar Tables
*   **Micro-Tables:** Do not dump full declension tables. Show *relevant* rows only.
    *   e.g., "Masculine vs Feminine" (2 rows).
    *   Highlight the *endings* in Bold or Primary Blue to show the change (e.g., стол -> на стол**е**).

---

## 6. Logo Usage
(Assumption: Standard logo files provided in `/logo`)

*   **Full Lockup:** Use on Splash screens, Marketing, and Desktop headers.
*   **Icon Only:** Use for App Icon, Mobile headers (top left), and Loading spinners.
*   **Clear Space:** Minimum 50% of the icon height on all sides.
*   **Backgrounds:**
    *   Primary Blue (`#0036A7`) or White (`#FFFFFF`) are preferred.
    *   Do not place over busy patterns.

---

## 7. Accessibility & Motion

### 7.1 Motion Principles
*   **Speed:** fast (200-300ms).
*   **Purpose:**
    *   **Transition:** Slide Left (progressing forward), Slide Right (going back).
    *   **Feedback:** Shake (Error), Bounce/Pop (Success).
*   **Reduced Motion:** Respect user device settings to disable non-essential animations.

### 7.2 Accessibility (WCAG AA)
*   **Text Scaling:** UI must accommodate dynamic type sizing (up to 200%).
*   **Screen Readers:**
    *   All Cyrillic text must have `lang="ru"`.
    *   Buttons must have labels (e.g., "Play Audio", not just a speaker icon).
*   **Touch:** Targets must be separated by at least 8px.

---

## 8. Do / Don't Gallery

| Category | **DO** | **DON'T** |
| :--- | :--- | :--- |
| **Typography** | Use Bold/Color for emphasis in Russian text. | Use *Italics* for Russian text. |
| **Color** | Use Red (`#D62718`) for accents and errors. | Use Red for large backgrounds (too aggressive). |
| **Layout** | meaningful whitespace; one concept per screen. | Cluttered screens with multiple grammar points. |
| **Feedback** | "Correct answer: [Text]" (Helpful). | "Wrong." (Dismissive). |
| **Audio** | Allow re-playing audio infinitely. | Auto-play once and hide the button. |