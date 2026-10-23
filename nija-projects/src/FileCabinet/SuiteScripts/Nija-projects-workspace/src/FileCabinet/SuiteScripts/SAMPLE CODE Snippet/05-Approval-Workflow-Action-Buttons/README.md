# Scenario 5: Multi-Level Approval Workflow & Dynamic Action Buttons

## Overview
NetSuite standard workflows can become brittle and complex when handling custom line-manager approval hierarchies, rejection reason prompts, and audit trails. This pattern uses a lightweight **User Event Script + Suitelet Action Handler** to build reliable, maintainable approval processes.

## Architecture & Lifecycle
```
+---------------+     Submit      +-------------------+
|  Draft (1)    | --------------> | Pending Appr (2)  |
+---------------+                 +---------+---------+
        ^                                   |
        |                 +-----------------+-----------------+
        |                 |                                   |
        | Re-submit       v Approve                           v Reject
        |         +---------------+                   +---------------+
        +---------| Approved (3)  |                   | Rejected (4)  |
                  +---------------+                   +---------------+
```

## Security & Authorization Rules
1. **Button Visibility:** "Approve" and "Reject" buttons only render if `currentUserId == approverEmployeeId` or if user holds the NetSuite Administrator role.
2. **Rejection Reason Prompt:** Rejection enforces mandatory comments via client prompt before calling the Suitelet.
3. **Audit Trail Logging:** All transitions store the approving user, exact timestamp, and notes in custom fields.
