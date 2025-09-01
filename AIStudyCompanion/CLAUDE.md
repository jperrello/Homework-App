# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- **Start development server**: `npm start` or `expo start`
- **Run on iOS**: `npm run ios` 
- **Run on Android**: `npm run android`
- **Run on Web**: `npm run web`

### Dependencies
- **Install dependencies**: `npm install`
- **Update dependencies**: `expo install --fix`

### Testing & Building
- TypeScript compilation is handled automatically by Metro bundler
- No separate build step required for development
- Use Expo Go app on mobile devices for testing
- **Testing**: No automated tests currently configured - manual testing through Expo Go
- **Linting**: No explicit lint command configured - relies on TypeScript and Metro bundler

## Project Architecture

### Tech Stack
- **Framework**: React Native with Expo SDK 53
- **Navigation**: React Navigation 6 (Stack + Bottom Tab)
- **State Management**: Zustand + React Context API
- **UI Libraries**: React Native Elements + React Native Paper
- **Storage**: Expo SecureStore (primary) + AsyncStorage (fallback)
- **HTTP Client**: Axios
- **Validation**: Zod schemas
- **Icons**: Expo Vector Icons + custom emojis

### Core Architecture Pattern
The app follows a service-oriented architecture with clear separation of concerns:

1. **Screens** (`src/screens/`) - React components for full-screen views
2. **Services** (`src/services/`) - Business logic and external API integrations
3. **Components** (`src/components/ui/`) - Reusable UI primitives with consistent theming
4. **Store** (`src/store/`) - Zustand stores for global state management
5. **Navigation** (`src/navigation/`) - Nested navigation structure (Auth → Main Tabs → Stacks)

### Key Design Patterns

#### Authentication Flow
The app uses a conditional navigation pattern:
- **Unauthenticated**: Welcome → Canvas Auth → Account Creation → Setup
- **Authenticated**: Main Tab Navigator with 4 primary screens

#### State Management Strategy
- **Global State**: Zustand stores with persistence (preferences, auth)
- **Local State**: React hooks for component-specific state
- **Context**: AuthContext for authentication state across the app

#### Canvas Integration Architecture
- **OAuth2 Flow**: Canvas authentication with secure token storage
- **API Services**: Modular services for courses, assignments, files, etc.
- **Offline Support**: AsyncStorage for caching Canvas data

### Navigation Structure
```
RootStack (Auth Flow)
├── WelcomeScreen
├── LoginScreen
├── CanvasAuthScreen / EnhancedCanvasAuthScreen
├── CreateAccountScreen
├── AccountSetupScreen
└── MainApp (Tab Navigator)
    ├── StudyQueue (Stack)
    │   ├── StudyQueueScreen
    │   ├── FlashcardCreationScreen
    │   ├── FlashcardStudyScreen
    │   ├── QuizStudyScreen
    │   └── ContentViewerScreen
    ├── ContentCreator (Stack)
    │   ├── ContentCreatorScreen
    │   └── FlashcardCreationScreen
    ├── ChatbotScreen (Single)
    └── Settings (Stack)
        ├── SettingsScreen
        ├── CustomInstructionsScreen
        ├── StudyPreferencesScreen
        ├── CanvasSettingsScreen
        └── DevTokenManagerScreen
```

**Current Screens Implemented:**
- ✅ Core auth flow (Welcome, Login, Canvas Auth, Account Setup)
- ✅ Main tab navigation with cosmic emoji themes
- ✅ Study Queue with flashcard and quiz support
- ✅ Content Creator functionality
- ✅ AI Chatbot screen
- ✅ Settings with custom instructions and preferences
- 🔄 Skills Coach (SkillsCoachScreen exists but not in navigation)
- 🔄 Enhanced Canvas Auth (implemented but not primary flow)

## Key Implementation Details

### Theme System
- Central theme configuration in `src/constants/index.ts`
- Study progress theme with cosmic colors and emojis
- Consistent spacing scale (4px grid) and typography
- All components should use theme tokens, not hardcoded values

### Component Library Usage
Always use components from `src/components/ui/` instead of raw React Native components:
- `Screen` instead of `View` + `SafeAreaView`
- `Button` instead of `TouchableOpacity`
- `Card` instead of `View` with custom styling
- `Header` instead of custom navigation headers

### AI Integration Pattern
AI services are designed to be provider-agnostic:
- `src/lib/llm/client.ts` - Abstract LLM interface with MockLLMClient implementation
- `src/services/aiService.ts` - Main AI service integration
- `src/services/chatbotService.ts` - Conversational AI interactions
- `src/services/studyAssistantService.ts` - Study-focused AI features
- Context injection from user preferences via `src/lib/prompt/buildContext.ts`
- Quiz generation through `src/lib/quiz/generator.ts`

**Current AI Features:**
- ✅ Mock LLM client for development testing
- ✅ Chatbot conversations with context
- ✅ Flashcard generation from content
- ✅ Quiz generation with multiple choice and short answer
- 🔄 OpenAI integration (configured but needs API key setup)

### Data Persistence Strategy
- **Secure Data**: Expo SecureStore (Canvas tokens, user credentials)
- **App Data**: AsyncStorage (preferences, study history, generated content)
- **Validation**: All stored data validated with Zod schemas

### Study Content Generation & Processing
- **Chunking**: Content split into 1-2k token chunks for LLM processing via `contentProcessingService.ts`
- **Schema Validation**: Generated content validated against TypeScript interfaces
- **Storage**: Local storage with indexing via `flashcardStorage.ts` and preferences store
- **Source Tracking**: References maintained to original Canvas content
- **Spaced Repetition**: SM-2 algorithm implementation in `spacedRepetitionService.ts`

**Content Services:**
- `src/services/contentProcessingService.ts` - Content chunking and processing
- `src/services/flashcardStorage.ts` - Flashcard persistence and retrieval  
- `src/services/spacedRepetitionService.ts` - Learning algorithm implementation
- `src/services/enhancedCanvasService.ts` - Extended Canvas API functionality

## Configuration

### Canvas Integration
Update `src/constants/index.ts` CANVAS_CONFIG:
- `BASE_URL`: Your institution's Canvas URL
- `CLIENT_ID`: OAuth2 application ID from Canvas
- `REDIRECT_URI`: Deep link for OAuth callback

### AI Service Setup
Configure in respective service files:
- OpenAI API key in environment or service configuration
- Model preferences in `AI_CONFIG` constants
- Custom instructions and prompt templates

### Environment Variables
Create `.env` file for sensitive configuration:
- API keys and tokens
- Canvas instance-specific settings
- Feature flags for development

## Development Guidelines

### File Organization
- Screen components in `src/screens/[ScreenName].tsx`
- Services in `src/services/[serviceName]Service.ts` or `[serviceName].ts`
- UI components in `src/components/ui/[ComponentName].tsx`
- Types in `src/types/index.ts` (centralized) and `src/types/env.d.ts`
- Utilities in `src/utils/` for configuration and examples
- Models in `src/models/` for data structures like preferences
- Store in `src/store/` for Zustand state management
- Navigation in `src/navigation/AppNavigator.tsx`
- Contexts in `src/contexts/` for React Context providers
- Theme configuration in `src/theme/index.ts`
- Constants centralized in `src/constants/index.ts`

### TypeScript Usage
- Strict mode enabled
- All navigation parameters typed
- Zod schemas for runtime validation
- Proper error handling with typed exceptions

### Canvas API Integration
- All Canvas endpoints accessed through `canvasService.ts` and `enhancedCanvasService.ts`
- OAuth token refresh handled automatically via `authService.ts`
- Rate limiting and error retry logic implemented
- Offline-first approach with AsyncStorage caching
- Support for both regular and enhanced Canvas authentication flows
- Dev token manager for testing (`DevTokenManagerScreen.tsx`)

### Testing Strategy
- Expo Go compatible (no custom native modules)
- Mock implementations for external services
- Component testing with proper mocking of navigation and state

## Debugging and Development

### Common Issues
- **Metro bundler cache**: Clear with `expo start --clear`
- **iOS simulator networking**: Use localhost, not 127.0.0.1
- **Canvas CORS**: Ensure proper OAuth2 redirect URI configuration

### Development Tools
- **React Developer Tools**: Available in web mode
- **Flipper**: For React Native debugging (if needed)
- **Expo DevTools**: Built into Expo CLI

### Performance Considerations
- Use `FlatList` for large datasets (study queues, course lists)
- Implement memoization for expensive computations
- Lazy load screens and components where appropriate
- Cache Canvas API responses appropriately

## Security & Privacy

### Token Management
- Canvas tokens encrypted in SecureStore
- Automatic token refresh before expiration
- Secure logout clears all stored credentials

### Data Handling
- No permanent storage of academic content without consent
- AI interactions logged only for improvement
- FERPA compliance considerations built into design
- Local-first approach minimizes data transmission

## Production Deployment

### Build Configuration
- Configure app.json for production builds
- Set up proper deep linking for OAuth
- Configure push notifications if needed
- Test on both iOS and Android devices

### Canvas Institution Setup
- Register OAuth2 application in Canvas
- Configure proper scopes for API access
- Test with institutional Canvas instance
- Verify FERPA compliance requirements