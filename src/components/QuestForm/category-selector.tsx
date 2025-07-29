import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { type Control, Controller } from 'react-hook-form';
import { LayoutAnimation, Platform, UIManager } from 'react-native';

// Import UI components from project
import { Pressable, Text, View } from '@/components/ui';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Category options with icons
const categoryOptions = [
  { id: 'fitness', label: 'Fitness', icon: 'heart' },
  { id: 'work', label: 'Work', icon: 'briefcase' },
  { id: 'self-care', label: 'Self-care', icon: 'smile' },
  { id: 'social', label: 'Social', icon: 'users' },
  { id: 'learning', label: 'Learning', icon: 'book-open' },
  { id: 'creative', label: 'Creative', icon: 'edit-3' },
  { id: 'household', label: 'Household', icon: 'home' },
  { id: 'outdoors', label: 'Outdoors', icon: 'sun' },
  { id: 'other', label: 'Other', icon: 'more-horizontal' },
];

type CategorySelectorProps = {
  control: Control<any>;
  questCategory: string;
};

export const CategorySelector = ({
  control,
  questCategory,
}: CategorySelectorProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get the selected category label
  const selectedCategory = categoryOptions.find(
    (cat) => cat.id === questCategory
  );

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  return (
    <View className="mb-4 rounded-xl bg-cardBackground p-4">
      <Text className="mb-2 text-base text-[#666]">What type of activity?</Text>
      <Controller
        control={control}
        render={({ field: { value, onChange } }) => (
          <View>
            <Pressable
              testID="category-selector"
              className="flex-row items-center justify-between py-2.5"
              onPress={toggleExpanded}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Select category"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View className="flex-row items-center">
                {selectedCategory && (
                  <Feather
                    name={selectedCategory.icon as any}
                    size={20}
                    color="#3B7A57" // Forest green color
                    className="mr-2"
                  />
                )}
                <Text className="text-lg">
                  {selectedCategory?.label || 'Select a category'}
                </Text>
              </View>
              <Feather 
                name={isExpanded ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#666" 
              />
            </Pressable>

            {/* Collapsible category list */}
            {isExpanded && (
              <View className="mt-2 overflow-hidden rounded-lg border border-[#F0F0F0]">
                {categoryOptions.map((category, index) => (
                  <Pressable
                    key={category.id}
                    testID={`category-option-${category.id}`}
                    className={`flex-row items-center px-3 py-3 ${
                      value === category.id ? 'bg-[#F8F8F8]' : 'bg-white'
                    } ${
                      index !== categoryOptions.length - 1 ? 'border-b border-[#F0F0F0]' : ''
                    }`}
                    onPress={() => {
                      onChange(category.id);
                      setIsExpanded(false);
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    }}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${category.label}`}
                    hitSlop={{ top: 5, bottom: 5, left: 10, right: 10 }}
                  >
                    <Feather
                      name={category.icon as any}
                      size={20}
                      color={value === category.id ? '#3B7A57' : '#666'}
                      className="mr-3"
                    />
                    <Text
                      className={`flex-1 text-base ${
                        value === category.id
                          ? 'font-medium text-[#3B7A57]'
                          : 'text-[#333]'
                      }`}
                    >
                      {category.label}
                    </Text>
                    {value === category.id && (
                      <Feather name="check" size={16} color="#3B7A57" />
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}
        name="questCategory"
      />
    </View>
  );
};
