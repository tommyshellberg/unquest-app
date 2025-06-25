module.exports = {
  useForm: () => ({
    control: {},
    handleSubmit: (fn) => (event) => {
      // Call the function with default form data
      const defaultData = { questCategory: 'fitness' };
      return fn(defaultData);
    },
    register: jest.fn(),
    watch: jest.fn((name) => {
      if (name === 'questCategory') return 'fitness';
      return '';
    }),
    reset: jest.fn(),
    setValue: jest.fn(),
    getValues: jest.fn(() => ({ questCategory: 'fitness' })),
    formState: {
      errors: {},
      isSubmitting: false,
      isValid: true,
    },
  }),
  Controller: ({ render, name }) => {
    const fieldProps = {
      value: name === 'questCategory' ? 'fitness' : '',
      onChange: jest.fn(),
      onBlur: jest.fn(),
    };
    return render({ field: fieldProps, fieldState: { error: null } });
  },
  useController: () => ({
    field: {
      value: '',
      onChange: jest.fn(),
      onBlur: jest.fn(),
    },
    fieldState: {
      error: null,
    },
  }),
};