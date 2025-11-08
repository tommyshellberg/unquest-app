/**
 * Custom Quest Form Hook
 *
 * Manages form state and validation for custom quest creation.
 * Handles quest name, duration, and category selection.
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';

import {
  DEFAULT_QUEST_CATEGORY,
  DEFAULT_QUEST_DURATION_MINUTES,
} from '../constants';
import type { CustomQuestFormData, CustomQuestFormValidation } from '../types';

type CategoryFormData = {
  questCategory: string;
};

export function useCustomQuestForm() {
  // Quest name and duration managed with useState for real-time updates
  const [questName, setQuestName] = useState('');
  const [questDuration, setQuestDuration] = useState(
    DEFAULT_QUEST_DURATION_MINUTES
  );

  // Category managed with react-hook-form for consistency with CategorySlider component
  const { control, handleSubmit, watch, reset } = useForm<CategoryFormData>({
    defaultValues: {
      questCategory: DEFAULT_QUEST_CATEGORY,
    },
    mode: 'onChange',
  });

  const questCategory = watch('questCategory');

  // Validation: quest can proceed if name is not empty
  const canContinue = questName.trim().length > 0;

  /**
   * Update quest name
   */
  const handleQuestNameChange = (name: string) => {
    setQuestName(name);
  };

  /**
   * Update quest duration (called when slider sliding is complete)
   */
  const handleDurationChange = (duration: number) => {
    setQuestDuration(duration);
  };

  /**
   * Reset form to default values
   */
  const resetForm = () => {
    setQuestName('');
    setQuestDuration(DEFAULT_QUEST_DURATION_MINUTES);
    reset({ questCategory: DEFAULT_QUEST_CATEGORY });
  };

  /**
   * Get current form data
   */
  const getFormData = (): CustomQuestFormData => ({
    questName: questName.trim(),
    questDuration,
    questCategory,
  });

  /**
   * Get form validation state
   */
  const getValidation = (): CustomQuestFormValidation => ({
    canContinue,
    validationErrors: !canContinue
      ? { questName: 'Quest name is required' }
      : undefined,
  });

  return {
    // State
    questName,
    questDuration,
    questCategory,
    canContinue,

    // Form controls
    control,
    handleSubmit,

    // Handlers
    handleQuestNameChange,
    handleDurationChange,
    resetForm,

    // Data access
    getFormData,
    getValidation,
  };
}
