# Aleng's Crispy Lechon — Order Management System
ITEC 80 (Human-Computer Interaction) — High-Fidelity Interactive Prototype

## How to run in VS Code
1. Open this folder in VS Code (File > Open Folder).
2. Install the **Live Server** extension (Ritwick Dey).
3. Right-click `index.html` > **Open with Live Server**.
   (You can also just double-click `index.html` to open it in a browser. Internet is needed for Google Fonts only.)

## Login
Click **Login** to open the app. Username and password checks are temporarily disabled.

## Files
- `index.html` — page shell
- `styles.css` — colors, typography, spacing, components
- `script.js`  — screens, data, navigation, forms, validation, dialogs, toasts

## Complete user task
Login > Dashboard > Add Order > confirm > Orders List > Order Details > Confirm Order > Mark as Completed > Order History / Reports

## Screens (10)
Login, Dashboard, Add Order, Orders, Order Details, Customers, Customer Details, Order History, Reports, Settings

## Usability issues and improvements
| Problem found | Improvement made |
|---|---|
| Save Order gave no feedback; order never appeared | Validation, confirm dialog, success toast, order added to list |
| Free-text dates and shipping fee allowed for Pickup | Date picker (past dates blocked), disabled Shipping Fee, inline errors |
| Cancel Order was instant with no way back | Confirm dialog + Undo toast |
| Dashboard and Reports numbers contradicted each other | All counts/totals computed from one shared order list |
| Filters and buttons did nothing | All filters, Add/Edit Customer, Change Password now work; empty states added |
