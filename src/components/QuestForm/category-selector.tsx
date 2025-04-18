import { Feather } from '@expo/vector-icons';
import { type BottomSheetModal } from '@gorhom/bottom-sheet';
import React, { useRef } from 'react';
import { type Control, Controller } from 'react-hook-form';

// Import UI components from project
import { Modal, Pressable, Text, View } from '@/components/ui';

// Category options with icons
const categoryOptions = [
  { id: 'fitness', label: 'Fitness', icon: 'heart' },
  { id: 'reading', label: 'Reading', icon: 'book-open' },
  { id: 'meditation', label: 'Meditation', icon: 'eye-off' },
  { id: 'social', label: 'Social', icon: 'coffee' },
  { id: 'learning', label: 'Learning', icon: 'edit-2' },
  { id: 'commuting', label: 'Commuting', icon: 'navigation' },
  { id: 'other', label: 'Other', icon: 'clock' },
];

type CategorySelectorProps = {
  control: Control<any>;
  questCategory: string;
};

export const CategorySelector = ({
  control,
  questCategory,
}: CategorySelectorProps) => {
  const modalRef = useRef<BottomSheetModal>(null);

  // Get the selected category label
  const selectedCategory = categoryOptions.find(
    (cat) => cat.id === questCategory
  );

  const openModal = () => {
    modalRef.current?.present();
  };

  const closeModal = () => {
    modalRef.current?.dismiss();
  };

  return (
    <View className="bg-cardBackground my-2.5 rounded-xl p-4 shadow-sm">
      <Text className="mb-2 text-base text-[#666]">What type of activity?</Text>
      <Controller
        control={control}
        render={({ field: { value, onChange } }) => (
          <View>
            <Pressable
              testID="category-selector"
              className="flex-row items-center justify-between py-2.5"
              onPress={openModal}
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
              <Feather name="chevron-down" size={20} color="#666" />
            </Pressable>

            {/* Bottom Sheet Modal for Categories */}
            <Modal ref={modalRef} snapPoints={['60%']} title="Select Category">
              <View className="p-4">
                {categoryOptions.map((category) => (
                  <Pressable
                    key={category.id}
                    testID={`category-option-${category.id}`}
                    className={`flex-row items-center border-b border-[#F0F0F0] py-3 ${
                      value === category.id ? 'bg-[#F8F8F8]' : ''
                    }`}
                    onPress={() => {
                      onChange(category.id);
                      closeModal();
                    }}
                  >
                    <Feather
                      name={category.icon as any}
                      size={24}
                      color={value === category.id ? '#3B7A57' : '#666'}
                      className="mr-3"
                    />
                    <Text
                      className={`flex-1 text-base ${
                        value === category.id
                          ? 'font-medium text-[#3B7A57]'
                          : ''
                      }`}
                    >
                      {category.label}
                    </Text>
                    {value === category.id && (
                      <Feather name="check" size={20} color="#3B7A57" />
                    )}
                  </Pressable>
                ))}
              </View>
            </Modal>
          </View>
        )}
        name="questCategory"
      />
    </View>
  );
};
