# Blog App Development Guide

## Project Overview
A modern, feature-rich blog platform built with Angular 19 and Firebase, supporting multiple user roles, rich content creation, and social engagement features.

## Technology Stack
- **Frontend**: Angular 19, Material 3, RxJS, NgxEditor, Signals
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Image Handling**: Cloudinary
- **Deployment**: GitHub Pages

## Project Structure
The project follows Angular's recommended structure with standalone components and feature modules:

```
src/
├── app/
│   ├── core/                          # Core functionality
│   │   ├── auth/                      # Authentication services
│   │   ├── guards/                    # Route guards
│   │   └── services/                  # Core services
│   │
│   ├── shared/                        # Shared components
│   │   ├── components/                # Reusable components
│   │   ├── directives/                # Custom directives
│   │   └── pipes/                     # Custom pipes
│   │
│   ├── features/                      # Feature modules
│   │   ├── blog/                      # Blog feature
│   │   ├── admin/                     # Admin dashboard
│   │   ├── user/                      # User profile
│   │   └── home/                      # Home page
│   │
│   ├── layout/                        # Layout components
│   └── app.component.ts               # Root component
│
├── environments/                      # Environment variables
└── styles/                            # Global styles
```

## Development Setup

### Prerequisites
- Node.js 18+
- npm 9+
- Angular CLI 19+

### Installation
1. Clone the repository
```bash
git clone https://github.com/your-username/blog-app.git
cd blog-app
```

2. Install dependencies
```bash
npm install
```

3. Create environment files
Create `src/environments/environment.ts` and `src/environments/environment.prod.ts` with your Firebase configuration.

4. Start the development server
```bash
npm start
```

## Environment Configuration
Create a `.env` file in the project root with the following variables:
```
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-auth-domain
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-storage-bucket
FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
FIREBASE_APP_ID=your-app-id
FIREBASE_MEASUREMENT_ID=your-measurement-id
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_UPLOAD_PRESET=your-upload-preset
```

## Development Workflows

### User Authentication
- **Core files**: `auth.service.ts`, `login.component.ts`, `signup.component.ts`
- **Roles**: Admin, Author, User
- **Auth Guards**: `auth.guard.ts`, `admin.guard.ts`, `author.guard.ts`

### Blog Post Management
- **Core files**: `blog.service.ts`, `create-post.component.ts`, `post-list.component.ts`, `post-detail.component.ts`
- **Features**: Create, edit, publish, view posts, featured posts, tags, image uploads

### Comment System
- **Core files**: `comment.service.ts`, `comment-list.component.ts`, `comment-item.component.ts`, `comment-form.component.ts`
- **Features**: Add, edit, delete comments, threaded replies, moderation

### Admin Dashboard
- **Core files**: `admin-dashboard.component.ts`, `admin-posts.component.ts`, `admin-users.component.ts`
- **Features**: User management, post moderation, statistics, analytics

### User Profile Management
- **Core files**: `profile.component.ts`, `user-posts.component.ts`
- **Features**: Profile editing, avatar uploads, post management

## Firebase Configuration

### Authentication
1. Enable Email/Password and Google sign-in methods in the Firebase console
2. Configure OAuth redirect domains

### Firestore Rules
We use role-based security rules. See `firestore.rules` for details.

### Storage Rules
Configure storage rules to allow authenticated users to upload images.

## Cloudinary Setup
1. Create a Cloudinary account
2. Set up an unsigned upload preset
3. Configure the cloud name and upload preset in your environment variables

## Code Style and Best Practices

### Angular Best Practices
- Use standalone components
- Leverage signals for state management
- Use reactive forms with proper validation
- Lazy load feature modules
- Use constructor injection with `inject()` function

### Firebase Best Practices
- Use security rules to protect data
- Batch related operations in transactions
- Use pagination for large data sets
- Cache frequently accessed data

### Performance Considerations
- Properly handle unsubscribing from observables
- Use trackBy with ngFor
- Optimize image loading and transformations
- Implement lazy loading for components and modules

## Deployment

### Development Build
```bash
npm run build
```

### Production Build
```bash
npm run build:prod
```

### Deploy to GitHub Pages
```bash
npm run deploy
```

## Testing

### Unit Tests
```bash
npm test
```

### End-to-End Tests
```bash
npm run e2e
```

## Continuous Integration
We use GitHub Actions for CI/CD. The configuration is in `.github/workflows/`.

## Troubleshooting
- **Firebase Connection Issues**: Check your API keys and project configuration
- **Cloudinary Upload Errors**: Verify upload preset permissions
- **Build Errors**: Make sure all dependencies are correctly installed

## Contributing Guidelines
1. Create a feature branch from `develop`
2. Make your changes
3. Write tests for your code
4. Create a pull request to `develop`
5. Wait for review and approval

## Resources
- [Angular Documentation](https://angular.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Material Design Components](https://material.angular.io/components/categories)
- [Cloudinary Documentation](https://cloudinary.com/documentation)