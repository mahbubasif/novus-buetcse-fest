# Admin & Student Panel Guide

## Overview

The platform now has **role-based UI** with a simple dropdown switcher. No authentication system - perfect for hackathon demos!

## 🎯 Role Switcher

- Located in the **top-right navbar**
- Two modes:
  - **🎓 Admin Panel** - Full content management access
  - **📚 Student View** - Read-only exploration mode

## Admin Features (Admin Panel)

When you select "Admin Panel" from the dropdown:

### Dashboard

✅ **Upload Material** button (top-right & floating mobile button)
✅ **Delete** buttons on each material card
✅ Full CRUD operations on all content
✅ "Manage and organize your learning resources" subtitle

### Capabilities

- Upload PDFs and code files (Python, JavaScript, Java, C++, etc.)
- Delete existing materials
- Edit metadata and categorization
- Process materials for RAG search
- Full access to all admin endpoints

## Student Features (Student View)

When you select "Student View" from the dropdown:

### Dashboard

❌ No upload button
❌ No delete buttons on material cards
✅ View and browse all materials
✅ Search and filter capabilities
✅ "Browse and explore your learning resources" subtitle

### Capabilities

- View all course materials
- Search through content
- Access intelligent RAG search
- Use AI chat features
- Generate lab exercises
- Read-only access to all content

## 🔧 Technical Implementation

### Frontend

```jsx
// Role Context (contexts/RoleContext.jsx)
- Manages role state with localStorage persistence
- Provides useRole() hook for components
- Roles: 'admin' | 'student'

// Components Updated
- Navbar.jsx: Role switcher dropdown
- Dashboard.jsx: Conditional rendering based on isAdmin
- MaterialCard.jsx: Delete button only shown if onDelete prop exists
```

### Backend

- **Service Role Key** used for all operations (bypasses RLS)
- No role checks in controllers (frontend handles UI restrictions)
- All endpoints are public for hackathon simplicity

### Role Persistence

- Role choice saved to `localStorage`
- Persists across page refreshes
- Default role: **Student**

## 🚀 How to Demo

### As Admin

1. Click role switcher → Select "Admin Panel"
2. Notice purple accent colors
3. Upload button appears
4. Click "Upload Material" → Upload a PDF or code file
5. Delete buttons visible on material cards

### As Student

1. Click role switcher → Select "Student View"
2. Notice blue accent colors
3. Upload button disappears
4. No delete buttons on cards
5. Full read/search/chat access

## 🎨 Visual Differences

| Feature        | Admin                        | Student            |
| -------------- | ---------------------------- | ------------------ |
| Accent Color   | Purple                       | Blue               |
| Upload Button  | ✅ Yes                       | ❌ No              |
| Delete Buttons | ✅ Yes                       | ❌ No              |
| Icon           | ⚙️ UserCog                   | 🎓 GraduationCap   |
| Empty State    | "Upload your first material" | "Check back later" |

## 🔐 Security Note

This is a **hackathon demo setup** with:

- No real authentication
- Frontend-only role switching
- Service role key bypasses all RLS policies
- Perfect for demos, **NOT production ready**

For production, you would need:

- Real authentication (Auth0, Supabase Auth, etc.)
- Backend role enforcement
- Enable RLS policies
- Use anon key + JWT tokens
- Session management

## 📝 Files Created/Modified

### New Files

- `frontend/src/contexts/RoleContext.jsx` - Role state management
- `frontend/src/components/RoleSwitcher.jsx` - Dropdown UI component

### Modified Files

- `frontend/src/App.jsx` - Wrapped with RoleProvider
- `frontend/src/components/layout/Navbar.jsx` - Added role switcher
- `frontend/src/pages/Dashboard.jsx` - Conditional admin features
- `frontend/src/components/MaterialCard.jsx` - Already had conditional delete

## 🎯 Next Steps

1. Start the frontend: `cd frontend && npm run dev`
2. Toggle between Admin/Student in navbar
3. Demo the different capabilities
4. Impress the hackathon judges! 🏆
