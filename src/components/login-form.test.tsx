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

  it('should show timeout error message', async () => {
    const axiosError = new Error('timeout of 10000ms exceeded');
    Object.assign(axiosError, {
      code: 'ECONNABORTED',
      config: {},
      isAxiosError: true,
    });

    mockedRequestMagicLink.mockRejectedValueOnce(axiosError);

    const { user } = setup(<LoginForm />);

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

    await waitFor(() => {
      expect(
        screen.getByText(/Request timed out. Please try again./i)
      ).toBeOnTheScreen();
    });
  });

  it('should show network error message', async () => {
    const axiosError = new Error('Network Error');
    Object.assign(axiosError, {
      config: {},
      isAxiosError: true,
      // No response property means network error
    });

    mockedRequestMagicLink.mockRejectedValueOnce(axiosError);

    const { user } = setup(<LoginForm />);

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

    await waitFor(() => {
      expect(
        screen.getByText(
          /Network error. Please check your connection and try again./i
        )
      ).toBeOnTheScreen();
    });
  });

  it('should show generic server error for 500 status', async () => {
    const axiosError = new Error('Request failed with status code 500');
    Object.assign(axiosError, {
      response: {
        status: 500,
        data: { message: 'Internal server error' },
      },
      config: {},
      isAxiosError: true,
    });

    mockedRequestMagicLink.mockRejectedValueOnce(axiosError);

    const { user } = setup(<LoginForm />);

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

    await waitFor(() => {
      expect(
        screen.getByText(/Login link failed to send. Please try again./i)
      ).toBeOnTheScreen();
    });
  });

  it('should show generic error for unknown errors', async () => {
    const unknownError = new Error('Something went wrong');

    mockedRequestMagicLink.mockRejectedValueOnce(unknownError);

    const { user } = setup(<LoginForm />);

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

    await waitFor(() => {
      expect(
        screen.getByText(/Login link failed to send. Please try again./i)
      ).toBeOnTheScreen();
    });
  });

  it('should allow sending email again from success screen', async () => {
    const { user } = setup(<LoginForm />);

    // First send
    const emailInput = screen.getByTestId('email-input');
    await user.type(emailInput, 'test@example.com');

    const button = screen.getByTestId('login-button');
    await waitFor(
      () => {
        expect(button.props.accessibilityState?.disabled).not.toBe(true);
      },
      { timeout: 3000 }
    );

    await user.press(button);

    // Wait for success screen
    await waitFor(() => {
      expect(screen.getByText(/Email sent/i)).toBeOnTheScreen();
    });

    // Click "Send Again" button
    const sendAgainButton = screen.getByText(/Send Again/i);
    await user.press(sendAgainButton);

    // Verify requestMagicLink was called twice
    await waitFor(() => {
      expect(mockedRequestMagicLink).toHaveBeenCalledTimes(2);
    });
  });

  it('should show contact support link after 3 failed attempts', async () => {
    const { user } = setup(<LoginForm />);

    const emailInput = screen.getByTestId('email-input');
    await user.type(emailInput, 'test@example.com');

    // First send - success
    const button = screen.getByTestId('login-button');
    await waitFor(
      () => {
        expect(button.props.accessibilityState?.disabled).not.toBe(true);
      },
      { timeout: 3000 }
    );
    await user.press(button);

    await waitFor(() => {
      expect(screen.getByText(/Email sent/i)).toBeOnTheScreen();
    });

    // Send again (attempt 2)
    await user.press(screen.getByText(/Send Again/i));
    await waitFor(() => {
      expect(mockedRequestMagicLink).toHaveBeenCalledTimes(2);
    });

    // Send again (attempt 3) - should show support link
    await user.press(screen.getByText(/Send Again/i));
    await waitFor(() => {
      expect(screen.getByText(/hello@emberglowapp.com/i)).toBeOnTheScreen();
    });
  });

  it('should display initial error from props', async () => {
    const errorMessage = 'Magic link expired';
    setup(<LoginForm initialError={errorMessage} />);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeOnTheScreen();
    });

    // Should be in email input mode (not success mode)
    expect(screen.getByTestId('email-input')).toBeOnTheScreen();
  });

  it('should show error when trying to submit invalid email', async () => {
    const { user } = setup(<LoginForm />);

    const emailInput = screen.getByTestId('email-input');
    await user.type(emailInput, 'notanemail');

    const button = screen.getByTestId('login-button');

    // Button should be disabled
    expect(button.props.accessibilityState?.disabled).toBe(true);

    // Try to press it anyway (simulating force press)
    await user.press(button);

    // Should not have called the API
    expect(mockedRequestMagicLink).not.toHaveBeenCalled();
  });
});

// Restore real timers after all tests
afterAll(() => {
  jest.useRealTimers();
});
