import { render, screen } from '@testing-library/react';
import App from './App';

test('renders manager assistant title', () => {
  render(<App />);
  const titleElement = screen.getByText(/課長お助けエージェント/i);
  expect(titleElement).toBeInTheDocument();
});
