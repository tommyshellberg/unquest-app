import React from 'react';

import { requestMagicLink } from '@/api/auth';
import { cleanup, screen, setup, waitFor } from '@/lib/test-utils';

import type { LoginFormProps } from './login-form';
import { LoginForm } from './login-form';

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

const onSubmitMock: jest.Mock<LoginFormProps['onSubmit']> = jest.fn();

// Mock the requestMagicLink function
jest.mock('@/api/auth', () => ({
  requestMagicLink: jest.fn(),
}));

// Mock PostHog
jest.mock('posthog-react-native', () => ({
  usePostHog: () => ({
    capture: jest.fn(),
  }),
}));

// Mock expo-linking
jest.mock('expo-linking', () => ({
  openURL: jest.fn(),
}));

const mockedRequestMagicLink = requestMagicLink as jest.MockedFunction<
  typeof requestMagicLink
>;

describe('LoginForm Form ', () => {
  beforeEach(() => {
    mockedRequestMagicLink.mockResolvedValue({ success: true });
  });
  beforeEach(() => {
    mockedRequestMagicLink.mockResolvedValue({ success: true });
  });

  it('renders correctly', async () => {
    setup(<LoginForm />);
    expect(await screen.findByText(/emberglow/i)).toBeOnTheScreen();
  });

  it('should disable button when email is empty', async () => {
    setup(<LoginForm />);

    const button = screen.getByTestId('login-button');

    // Button should be disabled when email is empty
    expect(button.props.accessibilityState?.disabled).toBe(true);
  });

  it('should disable button when email is invalid', async () => {
    const { user } = setup(<LoginForm />);

    const button = screen.getByTestId('login-button');
    const emailInput = screen.getByTestId('email-input');

    await user.type(emailInput, 'yyyyy');

    // Button should remain disabled for invalid email
    expect(button.props.accessibilityState?.disabled).toBe(true);
  });

  it('Should call onSubmit with correct values when email is valid', async () => {
    const { user } = setup(<LoginForm onSubmit={onSubmitMock} />);

    const button = screen.getByTestId('login-button');
    const emailInput = screen.getByTestId('email-input');

    await user.type(emailInput, 'youssef@gmail.com');

    // Wait for button to become enabled
    await waitFor(
      () => {
        expect(button.props.accessibilityState?.disabled).not.toBe(true);
      },
      { timeout: 3000 }
    );

    await user.press(button);

    await waitFor(
      () => {
        expect(onSubmitMock).toHaveBeenCalledTimes(1);
      },
      { timeout: 3000 }
    );

    // Update expectation to match actual call pattern
    expect(onSubmitMock).toHaveBeenCalledWith({
      email: 'youssef@gmail.com',
    });
  });

  it('should show success message with email address after sending email', async () => {
    const { user } = setup(<LoginForm />);

    const button = screen.getByTestId('login-button');
    const emailInput = screen.getByTestId('email-input');
    const testEmail = 'test@example.com';

    await user.type(emailInput, testEmail);

    // Wait for button to become enabled
    await waitFor(
      () => {
        expect(button.props.accessibilityState?.disabled).not.toBe(true);
      },
      { timeout: 3000 }
    );

    await user.press(button);

    // Wait for all success elements in a single waitFor
    await waitFor(
      () => {
        const successMessages = screen.queryAllByText(/Email sent|sent/i);
        expect(successMessages.length).toBeGreaterThan(0);
        expect(screen.getByText(testEmail)).toBeOnTheScreen();
        expect(
          screen.getByText(/Enter a different email address/i)
        ).toBeOnTheScreen();
      },
      { timeout: 3000 }
    );
  });

  it('should return to email form when "Enter a different email address" is clicked', async () => {
    const { user } = setup(<LoginForm />);

    // First submit the form
    const button = screen.getByTestId('login-button');
    const emailInput = screen.getByTestId('email-input');
    await user.type(emailInput, 'test@example.com');

    await waitFor(
      () => {
        expect(button.props.accessibilityState?.disabled).not.toBe(true);
      },
      { timeout: 3000 }
    );

    await user.press(button);

    // Wait for the success screen
    await waitFor(
      () => {
        expect(screen.getByText(/Email sent/i)).toBeOnTheScreen();
      },
      { timeout: 3000 }
    );

    // Click "Enter a different email address"
    const changeEmailLink = screen.getByText(
      /Enter a different email address/i
    );
    await user.press(changeEmailLink);

    // Check for both elements in a single waitFor
    await waitFor(
      () => {
        expect(screen.getByTestId('email-input')).toBeOnTheScreen();
        expect(screen.getByText(/Send Link/i)).toBeOnTheScreen();
      },
      { timeout: 3000 }
    );
  });

  it('should show specific error message for 409 email already in use', async () => {
    // Mock axios error structure to simulate what the actual axios lib would return
    const axiosError = new Error('Request failed with status code 409');
    Object.assign(axiosError, {
      response: {
        status: 409,
        data: { message: 'mail address is already in use by another account' },
      },
      config: {},
      isAxiosError: true,
    });

    mockedRequestMagicLink.mockRejectedValueOnce(axiosError);

    const { user } = setup(<LoginForm />);

    const button = screen.getByTestId('login-button');
    const emailInput = screen.getByTestId('email-input');
    const testEmail = 'existing@example.com';

    await user.type(emailInput, testEmail);

    // Wait for button to become enabled
    await waitFor(
      () => {
        expect(button.props.accessibilityState?.disabled).not.toBe(true);
      },
      { timeout: 3000 }
    );

    await user.press(button);

    // Wait for the specific 409 error message
    await waitFor(() => {
      expect(
        screen.getByText(
          /This email address is already associated with an account/i
        )
      ).toBeOnTheScreen();
    });

    // Verify the form stays in the email input state (doesn't show success)
    expect(screen.getByTestId('email-input')).toBeOnTheScreen();

    // Verify the success message is NOT shown
    expect(screen.queryByText(/Email sent/i)).not.toBeOnTheScreen();
  });
});

// Restore real timers after all tests
afterAll(() => {
  jest.useRealTimers();
});
