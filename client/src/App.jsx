import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import store from './store'
import AuthPage from './pages/AuthPage'

console.log('App.jsx - Store:', store);
console.log('App.jsx - Store state:', store.getState());

function App() {
  console.log('App rendering...');
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AuthPage />
      </BrowserRouter>
    </Provider>
  )
}

export default App
