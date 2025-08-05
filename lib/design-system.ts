export const designSystem = {
  colors: {
    primary: { 
      50: '#eff6ff',
      500: '#3b82f6',
      900: '#1e3a8a'
    },
    semantic: {
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444'
    }
  },
  
  components: {
    card: 'bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow',
    button: {
      primary: 'bg-primary-500 text-white hover:bg-primary-600 rounded-lg px-4 py-2',
      secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg px-4 py-2',
      ghost: 'hover:bg-gray-100 rounded-lg px-4 py-2'
    },
    badge: {
      urgent: 'bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs',
      warning: 'bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs',
      success: 'bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs'
    }
  },
  
  animations: {
    fadeIn: 'animate-fade-in',
    slideUp: 'animate-slide-up',
    smooth: 'transition-all duration-200 ease-in-out'
  }
}
