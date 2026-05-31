# Swaram Music Academy — Operations Guide

> This document describes how Swaram Music Academy operates, the business rules the software must enforce, and implementation decisions. Refer to this when making feature or architectural choices.

---

## Table of Contents

- [Academic Year & Cycles](#academic-year--cycles)
- [Courses & Years](#courses--years)
- [Batches](#batches)
- [Student Lifecycle](#student-lifecycle)
- [Enrollment](#enrollment)
- [Year Promotion (Exams)](#year-promotion-exams)
- [Fee Structure](#fee-structure)
- [Installments & Due Dates](#installments--due-dates)
- [Registration Fee](#registration-fee)
- [Contacts](#contacts)
- [Known Limitations & Planned Features](#known-limitations--planned-features)

---

## Academic Year & Cycles

- **Primary cycle:** May → April (e.g., May 2025 – April 2026)
- **Secondary cycle:** October → September (for students who join mid-year or defer May exams)
- A student's academic year cycle is determined by when they started or when they last took their exam.
- The `getAcademicYear()` utility returns the starting year of the current academic cycle. If the current month is before May, it returns `currentYear - 1`.

### How it works in practice

| Scenario | Academic Year | Cycle |
|----------|--------------|-------|
| Student joins in June 2025 | 2025 | May 2025 – Apr 2026 |
| Student joins in January 2026 | 2025 | May 2025 – Apr 2026 (joins mid-cycle) |
| Student defers May 2026 exam to Oct 2026 | 2026 | Oct 2026 – Sep 2027 (shifts to secondary cycle) |

---

## Courses & Years

- Each course has a `duration_years` (e.g., Vocal = 5 years, Tabla = 3 years).
- A "year" in a course is analogous to a grade in school (Vocal Year 1, Vocal Year 2, etc.).
- Students progress through years by passing exams (see [Year Promotion](#year-promotion-exams)).
- Each course has a `fee_structures` table with per-year fee amounts.

### Current courses

| Course | Duration | Installments per year |
|--------|----------|----------------------|
| Vocal | 5 years | 2 |
| Tabla | 3 years | 2 |
| Sitar | 3 years | 4 |
| Flute | (TBD) | 4 (possibly) |

> **Note:** The number of installments and their due dates are currently **hardcoded** in the `add_installments_after_fee_summary` trigger. This needs to be migrated to a configurable system (see [Planned Features](#known-limitations--planned-features)).

---

## Batches

- A batch groups students by course + year + schedule (e.g., "Vocal Year 1 - Morning Batch").
- Each batch belongs to an academic year and has:
  - `batch_year_courses`: links the batch to one or more course+year combinations.
  - `batch_schedules`: day-of-week + start/end time entries.
- Batches are filtered by academic year in the UI using `getAcademicYear()`.

---

## Student Lifecycle

```
Registration → Enrollment → Active Study → Year Promotion → ... → Course Completion
                                 ↑                |
                                 |   (may repeat)  |
                                 └─────────────────┘
```

1. **Registration:** Student record created with personal details, address, avatar. A `student_registeration_fees` record is auto-created via trigger (`add_registration_fee_on_student_insert`).
2. **Enrollment:** Student is enrolled into a course + batch + year. A `student_fee_summary` is created via `create_fee_summary()` RPC, which triggers installment creation.
3. **Active Study:** Student attends classes per their batch schedule.
4. **Promotion:** After passing an exam, the student is promoted to the next year (see below).
5. **Completion:** When a student finishes the final year of a course, their enrollment is manually marked as `Completed`.

### Enrollment statuses

| Status | Meaning |
|--------|---------|
| `Enrolled` | Active enrollment |
| `Completed` | Finished all years of the course |
| `Dropped` | Student left the course (triggers fee summary cancellation) |

---

## Enrollment

- A student can be enrolled in **multiple courses simultaneously** (e.g., Vocal Year 3 + Tabla Year 1).
- Each enrollment is linked to a specific batch.
- `current_year` on the enrollment tracks which year the student is currently in.
- Enrolling a student calls `create_fee_summary(enrollment_id)` which:
  1. Looks up the fee structure for that course + year.
  2. Creates a `student_fee_summary` record.
  3. Triggers `add_installments_after_fee_summary` which creates installment rows.

---

## Year Promotion (Exams)

### When it happens

- **Primary exam window:** Around April–May each year.
- **Secondary exam window:** Around September–October each year.
- Most students take the May exam. A student may defer to October if they:
  - Joined classes late in the academic year (e.g., January).
  - Need more preparation time.
  - Want to split exams (e.g., take Vocal in May, Tabla in October).

### How promotion works

- Promotion is done **per batch** (which maps to a specific course + year).
- It follows a **promote-all-with-exceptions** model:
  - All enrolled students in the batch are selected by default.
  - The admin deselects students who are not appearing for the exam or not continuing.
- The UI is at `/promotions` and uses a 3-step wizard: select batch → select students → confirm.

### What promotion does (per student)

1. Updates `enrollments.current_year` from N → N+1.
2. Reassigns `enrollments.batch_id` to the target batch (the Year N+1 batch).
3. Creates a new `student_fee_summary` for the new year (which auto-creates installments).
4. Writes an audit record to `promotion_history`.

### Final year

- If a student is in the final year of a course (`current_year >= course.duration_years`), they **cannot be promoted**.
- Marking as `Completed` is done manually from the enrollment management page.

### Undo

- Promotions can be undone from `/promotions/history`.
- Undo reverts the enrollment year + batch, cancels the new fee summary, and deletes pending installments (completed payments are preserved).

---

## Fee Structure

- Each course has a per-year fee amount defined in `fee_structures`.
- When a student is enrolled or promoted, `create_fee_summary()` creates a `student_fee_summary` record with:
  - `total_fees` — from fee_structures
  - `discount` — can be applied manually (defaults to 0)
  - `final_fees` — computed as `total_fees - discount`
  - `status` — `Active` or `Cancelled`
- Fee summaries are cancelled when an enrollment is dropped.

### Fee summary statuses

| Status | Meaning |
|--------|---------|
| `Active` | Current and valid |
| `Cancelled` | Enrollment dropped or promotion undone |

---

## Installments & Due Dates

### Current (hardcoded) behavior

Installments are created by the `add_installments_after_fee_summary` trigger when a `student_fee_summary` row is inserted. The trigger:

- Looks up the course name.
- **Sitar:** 4 installments with hardcoded dates (Jun 21, Sep 7, Nov 24, Feb 10 of 2025-26).
- **All other courses:** 2 installments with hardcoded dates (Jun 21, Nov 25 of 2025-26).
- Splits `final_fees` evenly across installments (remainder goes to last installment).

### Installment payment statuses

| Status | Meaning |
|--------|---------|
| `Pending` | Not yet paid |
| `Completed` | Paid, linked to a receipt |

### Problems with current approach

1. **Dates are hardcoded** to 2025-26 — newly created installments for future academic years get wrong dates.
2. **No concept of the student's academic cycle** — May-Apr vs Oct-Sep students get the same dates.
3. **Number of installments is determined by course name** (string matching "Sitar") rather than a configurable field.

### Planned: Configurable installment deadlines

> **Status: Not yet implemented**

The plan is to create a configuration UI where the admin can set:

- **Installment deadline templates** — year-agnostic dates (e.g., "1st installment: October 1st", "2nd installment: February 1st").
- Separate templates for:
  - 2-installment courses (May-Apr cycle)
  - 2-installment courses (Oct-Sep cycle)
  - 4-installment courses (Sitar/Flute)
- When installments are created, the trigger reads the template and applies the correct year based on the student's academic cycle.
- Dates are the same year after year — only the year portion changes.

---

## Registration Fee

- Auto-created when a student record is inserted (trigger: `add_registration_fee_on_student_insert`).
- Stored in `student_registeration_fees`.
- One-time fee — paid once when the student first joins, not per year or per course.
- The amount is globally configurable from `/settings`.
- The current setting is stored in `app_settings` under key `registration_fee`.
- Updating the global registration fee only affects newly registered students. Existing registration fee records are preserved for historical accuracy.
- Payment is recorded by creating a `receipts` row and updating `is_paid = true` + `receipt_id`.

---

## Contacts

- Contacts are stored in a `contacts` table (name, phone, whatsapp, email).
- Linked to students via `students_contacts` join table (with `relationship` and `occupation`).
- A student can have multiple contacts (Self, Mother, Father, Guardian).
- Phone numbers are stored in E.164 format (e.g., `+919898293324`) using the phone input component with country code selector (defaults to India +91).
- WhatsApp links use the number without the `+` prefix for `wa.me/` URLs.

---

## Known Limitations & Planned Features

### 🔴 Critical

| Issue | Description | Status |
|-------|-------------|--------|
| Hardcoded installment dates | Due dates are fixed to 2025-26 in `add_installments_after_fee_summary` trigger | Needs configurable deadline templates |
| No academic cycle per student | All students get May-Apr dates regardless of when they actually started | Needs student-level or enrollment-level cycle tracking |

### 🟡 Planned Features

| Feature | Description |
|---------|-------------|
| Configurable installment deadlines | Admin UI to set year-agnostic deadline templates per installment count + cycle type |
| Installment count per course | Move from course-name-based logic to a configurable `num_installments` field on courses |
| Student academic cycle | Track whether a student is on May-Apr or Oct-Sep cycle, per enrollment |
| Bulk receipt generation | Generate and download receipts for multiple students at once |

### 🟢 Recently Completed

| Feature | Description |
|---------|-------------|
| Year Promotion | Batch-level promotion wizard with audit log and undo |
| Phone input with country code | Searchable country code dropdown, defaults to +91 India |
| Fee filtering by current year | Fee summary, payment schedule, and payment history now filter to current enrollment year + overdue items |
| Payment status chips | Payment history shows Paid / Upcoming / Overdue badges |
