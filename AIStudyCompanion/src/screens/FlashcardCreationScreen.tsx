import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { THEME } from '../constants';
import canvasService from '../services/canvasService';
import aiService from '../services/aiService';
import flashcardStorage from '../services/flashcardStorage';
import { CanvasCourse, CanvasAssignment, CanvasModule, CanvasFile, FlashcardSet } from '../types';

export default function FlashcardCreationScreen() {
  const navigation = useNavigation<any>();
  
  // Course selection
  const [courses, setCourses] = useState<CanvasCourse[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CanvasCourse | null>(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  
  // Content selection
  const [modules, setModules] = useState<CanvasModule[]>([]);
  const [assignments, setAssignments] = useState<CanvasAssignment[]>([]);
  const [files, setFiles] = useState<CanvasFile[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [selectedAssignments, setSelectedAssignments] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  
  // Dropdown visibility states
  const [showModulesDropdown, setShowModulesDropdown] = useState(false);
  const [showAssignmentsDropdown, setShowAssignmentsDropdown] = useState(false);
  const [showFilesDropdown, setShowFilesDropdown] = useState(false);
  
  // Configuration
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [flashcardCount, setFlashcardCount] = useState('10');
  
  // Flashcard Set Configuration
  const [flashcardSetName, setFlashcardSetName] = useState('');
  const [flashcardSetDescription, setFlashcardSetDescription] = useState('');
  const [practiceFrequency, setPracticeFrequency] = useState<FlashcardSet['practice_frequency']>('weekly');
  const [customFrequencyDays, setCustomFrequencyDays] = useState('7');
  const [showFrequencyModal, setShowFrequencyModal] = useState(false);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setIsLoading(true);
    try {
      const [currentResponse, completedResponse] = await Promise.all([
        canvasService.getUserCourses(),
        canvasService.getCompletedCourses()
      ]);
      
      let allCourses: CanvasCourse[] = [];
      if (currentResponse.success) {
        allCourses = [...allCourses, ...currentResponse.data];
      }
      if (completedResponse.success) {
        allCourses = [...allCourses, ...completedResponse.data];
      }
      
      setCourses(allCourses);
    } catch (error) {
      console.error('Error loading courses:', error);
      Alert.alert('Error', 'Failed to load courses');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCourseContent = async (courseId: number) => {
    setLoadingContent(true);
    try {
      const [modulesResponse, assignmentsResponse, filesResponse] = await Promise.all([
        canvasService.getCourseModules?.(courseId) || { success: false, data: [] },
        canvasService.getCourseAssignments(courseId),
        canvasService.getCourseFiles?.(courseId) || { success: false, data: [] }
      ]);
      
      if (modulesResponse.success) {
        setModules(modulesResponse.data);
      } else {
        setModules([]);
      }
      
      if (assignmentsResponse.success) {
        setAssignments(assignmentsResponse.data);
      } else {
        setAssignments([]);
      }
      
      if (filesResponse.success) {
        setFiles(filesResponse.data);
      } else {
        setFiles([]);
      }
    } catch (error) {
      console.error('Error loading course content:', error);
      Alert.alert('Error', 'Failed to load course content');
    } finally {
      setLoadingContent(false);
    }
  };

  const handleCourseSelect = async (course: CanvasCourse) => {
    setSelectedCourse(course);
    setShowCourseModal(false);
    
    // Clear previous selections
    setSelectedModules([]);
    setSelectedAssignments([]);
    setSelectedFiles([]);
    
    // Reset dropdown states
    setShowModulesDropdown(false);
    setShowAssignmentsDropdown(false);
    setShowFilesDropdown(false);
    
    await loadCourseContent(course.id);
  };

  const toggleSelection = (id: string, selectedList: string[], setSelectedList: (list: string[]) => void) => {
    if (selectedList.includes(id)) {
      setSelectedList(selectedList.filter(item => item !== id));
    } else {
      setSelectedList([...selectedList, id]);
    }
  };

  const buildContentContext = () => {
    if (!selectedCourse) return '';
    
    let content = `Course: ${selectedCourse.name} (${selectedCourse.course_code})\n\n`;
    
    // Add selected modules
    if (selectedModules.length > 0) {
      content += 'Selected Modules:\n';
      selectedModules.forEach(moduleId => {
        const module = modules.find(m => m.id.toString() === moduleId);
        if (module) {
          content += `- ${module.name}\n`;
        }
      });
      content += '\n';
    }
    
    // Add selected assignments
    if (selectedAssignments.length > 0) {
      content += 'Selected Assignments:\n';
      selectedAssignments.forEach(assignmentId => {
        const assignment = assignments.find(a => a.id.toString() === assignmentId);
        if (assignment) {
          content += `- ${assignment.name}\n`;
          if (assignment.description) {
            content += `  Description: ${assignment.description.replace(/<[^>]*>/g, '').substring(0, 300)}...\n`;
          }
        }
      });
      content += '\n';
    }
    
    // Add selected files
    if (selectedFiles.length > 0) {
      content += 'Selected Files:\n';
      selectedFiles.forEach(fileId => {
        const file = files.find(f => f.id.toString() === fileId);
        if (file) {
          content += `- ${file.display_name}\n`;
        }
      });
      content += '\n';
    }
    
    // Add additional context
    if (additionalInfo.trim()) {
      content += `Additional Context:\n${additionalInfo}\n\n`;
    }
    
    // If no specific content selected, use general course info
    if (selectedModules.length === 0 && selectedAssignments.length === 0 && selectedFiles.length === 0) {
      content += `Generate flashcards for key concepts, important terms, and fundamental principles typically covered in ${selectedCourse.name}.`;
    }
    
    return content;
  };

  const generateFlashcards = async () => {
    if (!selectedCourse) {
      Alert.alert('No Course Selected', 'Please select a course first.');
      return;
    }

    const hasContent = selectedModules.length > 0 || selectedAssignments.length > 0 || selectedFiles.length > 0 || additionalInfo.trim();
    if (!hasContent) {
      Alert.alert(
        'No Content Selected',
        'Please select some modules, assignments, files, or add additional information to generate flashcards from.',
        [
          { text: 'Generate Anyway', onPress: () => proceedWithGeneration() },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }

    await proceedWithGeneration();
  };

  const proceedWithGeneration = async () => {
    setIsGenerating(true);
    try {
      const content = buildContentContext();
      const count = parseInt(flashcardCount) || 10;

      const response = await aiService.generateFlashcards({
        content,
        courseContext: {
          courseName: selectedCourse!.name,
          courseId: selectedCourse!.id,
        },
        count,
      });

      if (response.success && response.data.length > 0) {
        // Create flashcard set if name is provided
        let flashcardSetId: string | undefined = undefined;
        
        if (flashcardSetName.trim()) {
          const setId = flashcardStorage.generateFlashcardSetId();
          const flashcardSet: FlashcardSet = {
            id: setId,
            name: flashcardSetName.trim(),
            description: flashcardSetDescription.trim() || undefined,
            course_id: selectedCourse!.id,
            topic: selectedCourse!.name,
            practice_frequency: practiceFrequency,
            custom_frequency_days: practiceFrequency === 'custom' ? parseInt(customFrequencyDays) : undefined,
            next_practice_date: flashcardStorage.calculateNextPracticeDate(practiceFrequency, practiceFrequency === 'custom' ? parseInt(customFrequencyDays) : undefined),
            created_at: new Date(),
            updated_at: new Date(),
            flashcard_count: response.data.length,
            is_active: true
          };
          
          await flashcardStorage.saveFlashcardSet(flashcardSet);
          flashcardSetId = setId;
        }

        // Update flashcards with set ID if applicable
        const flashcardsWithSetId = response.data.map(card => ({
          ...card,
          flashcard_set_id: flashcardSetId
        }));

        // Save flashcards to storage
        const sessionId = flashcardStorage.generateSessionId();
        await flashcardStorage.saveFlashcards(sessionId, flashcardsWithSetId);
        
        const setMessage = flashcardSetName.trim() 
          ? `\n\nFlashcard Set: "${flashcardSetName}"\nPractice Schedule: ${getPracticeFrequencyLabel(practiceFrequency, customFrequencyDays)}`
          : '';
          
        Alert.alert(
          'Flashcards Generated! 🎉',
          `Successfully generated ${response.data.length} flashcards for ${selectedCourse!.name}.${setMessage}\n\nWhat would you like to do next?`,
          [
            {
              text: 'Study Now',
              onPress: () => {
                navigation.navigate('StudyQueue', {
                  screen: 'FlashcardStudy',
                  params: {
                    flashcardIds: response.data.map(card => card.id),
                    courseId: selectedCourse!.id
                  }
                });
              },
            },
            {
              text: 'View in Study Queue',
              onPress: () => {
                // Navigate to study queue and refresh to show new cards
                navigation.navigate('StudyQueue', {
                  refresh: true,
                  newCardsGenerated: true,
                  newCardsCount: response.data.length,
                  courseName: selectedCourse!.name
                });
              },
            },
            { 
              text: 'Create More',
              style: 'default',
              onPress: () => {
                // Reset form for creating more flashcards
                setSelectedModules([]);
                setSelectedAssignments([]);
                setSelectedFiles([]);
                setAdditionalInfo('');
                setFlashcardCount('10');
                setFlashcardSetName('');
                setFlashcardSetDescription('');
                setPracticeFrequency('weekly');
                setCustomFrequencyDays('7');
              }
            },
          ]
        );
      } else {
        Alert.alert('Generation Failed', response.error || 'Failed to generate flashcards. Please try again.');
      }
    } catch (error) {
      console.error('Error generating flashcards:', error);
      Alert.alert('Error', 'An error occurred while generating flashcards. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const canGenerate = selectedCourse && !isGenerating && !loadingContent;

  const getPracticeFrequencyLabel = (frequency: FlashcardSet['practice_frequency'], customDays?: string): string => {
    switch (frequency) {
      case 'daily': return 'Daily';
      case 'every_2_days': return 'Every 2 days';
      case 'weekly': return 'Weekly';
      case 'bi_weekly': return 'Bi-weekly';
      case 'monthly': return 'Monthly';
      case 'custom': return `Every ${customDays || 7} days`;
      default: return 'Weekly';
    }
  };

  const getFrequencyOptions = (): Array<{label: string, value: FlashcardSet['practice_frequency']}> => [
    { label: 'Daily', value: 'daily' },
    { label: 'Every 2 days', value: 'every_2_days' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Bi-weekly', value: 'bi_weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Custom', value: 'custom' }
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.colors.primary} />
          <Text style={styles.loadingText}>Loading courses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={THEME.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Flashcards</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Course Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Course</Text>
          <TouchableOpacity 
            style={styles.selector}
            onPress={() => setShowCourseModal(true)}
          >
            <Text style={[styles.selectorText, selectedCourse && styles.selectedText]}>
              {selectedCourse ? selectedCourse.name : 'Choose a course'}
            </Text>
            <Ionicons name="chevron-down" size={20} color={THEME.colors.textSecondary} />
          </TouchableOpacity>
          {selectedCourse && (
            <Text style={styles.courseCode}>Course Code: {selectedCourse.course_code}</Text>
          )}
        </View>

        {selectedCourse && (
          <>
            {loadingContent ? (
              <View style={styles.loadingSection}>
                <ActivityIndicator size="small" color={THEME.colors.primary} />
                <Text style={styles.loadingText}>Loading course content...</Text>
              </View>
            ) : (
              <>
                {/* Modules Selection */}
                {modules.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Modules ({modules.length} available)</Text>
                    <TouchableOpacity 
                      style={[styles.dropdownHeader, showModulesDropdown && styles.dropdownHeaderExpanded]}
                      onPress={() => setShowModulesDropdown(!showModulesDropdown)}
                    >
                      <View style={styles.dropdownHeaderLeft}>
                        <Text style={styles.dropdownTitle}>
                          {selectedModules.length > 0 
                            ? `${selectedModules.length} module${selectedModules.length !== 1 ? 's' : ''} selected` 
                            : 'Select modules'}
                        </Text>
                        {selectedModules.length > 0 && (
                          <Text style={styles.dropdownSubtitle}>
                            {selectedModules.slice(0, 2).map(id => {
                              const module = modules.find(m => m.id.toString() === id);
                              return module?.name;
                            }).filter(Boolean).join(', ')}{selectedModules.length > 2 ? ` and ${selectedModules.length - 2} more...` : ''}
                          </Text>
                        )}
                      </View>
                      <View style={styles.dropdownIconContainer}>
                        <Ionicons 
                          name={showModulesDropdown ? "chevron-up" : "chevron-down"} 
                          size={20} 
                          color={THEME.colors.primary} 
                        />
                      </View>
                    </TouchableOpacity>
                    
                    {showModulesDropdown && (
                      <View style={styles.dropdownContent}>
                        <ScrollView style={styles.dropdownScrollView} nestedScrollEnabled>
                          {modules.map((module) => (
                            <TouchableOpacity
                              key={module.id}
                              style={[
                                styles.dropdownItem,
                                selectedModules.includes(module.id.toString()) && styles.selectedDropdownItem
                              ]}
                              onPress={() => toggleSelection(module.id.toString(), selectedModules, setSelectedModules)}
                            >
                              <View style={styles.itemInfo}>
                                <Text style={[
                                  styles.dropdownItemTitle,
                                  selectedModules.includes(module.id.toString()) && styles.selectedDropdownItemText
                                ]}>
                                  {module.name}
                                </Text>
                              </View>
                              <Ionicons
                                name={selectedModules.includes(module.id.toString()) ? "checkmark-circle" : "radio-button-off"}
                                size={22}
                                color={selectedModules.includes(module.id.toString()) ? THEME.colors.primary : THEME.colors.textSecondary}
                              />
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                )}

                {/* Assignments Selection */}
                {assignments.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Assignments ({assignments.length} available)</Text>
                    <TouchableOpacity 
                      style={[styles.dropdownHeader, showAssignmentsDropdown && styles.dropdownHeaderExpanded]}
                      onPress={() => setShowAssignmentsDropdown(!showAssignmentsDropdown)}
                    >
                      <View style={styles.dropdownHeaderLeft}>
                        <Text style={styles.dropdownTitle}>
                          {selectedAssignments.length > 0 
                            ? `${selectedAssignments.length} assignment${selectedAssignments.length !== 1 ? 's' : ''} selected` 
                            : 'Select assignments'}
                        </Text>
                        {selectedAssignments.length > 0 && (
                          <Text style={styles.dropdownSubtitle}>
                            {selectedAssignments.slice(0, 2).map(id => {
                              const assignment = assignments.find(a => a.id.toString() === id);
                              return assignment?.name;
                            }).filter(Boolean).join(', ')}{selectedAssignments.length > 2 ? ` and ${selectedAssignments.length - 2} more...` : ''}
                          </Text>
                        )}
                      </View>
                      <View style={styles.dropdownIconContainer}>
                        <Ionicons 
                          name={showAssignmentsDropdown ? "chevron-up" : "chevron-down"} 
                          size={20} 
                          color={THEME.colors.primary} 
                        />
                      </View>
                    </TouchableOpacity>
                    
                    {showAssignmentsDropdown && (
                      <View style={styles.dropdownContent}>
                        <ScrollView style={styles.dropdownScrollView} nestedScrollEnabled>
                          {assignments.map((assignment) => (
                            <TouchableOpacity
                              key={assignment.id}
                              style={[
                                styles.dropdownItem,
                                selectedAssignments.includes(assignment.id.toString()) && styles.selectedDropdownItem
                              ]}
                              onPress={() => toggleSelection(assignment.id.toString(), selectedAssignments, setSelectedAssignments)}
                            >
                              <View style={styles.itemInfo}>
                                <Text style={[
                                  styles.dropdownItemTitle,
                                  selectedAssignments.includes(assignment.id.toString()) && styles.selectedDropdownItemText
                                ]}>
                                  {assignment.name}
                                </Text>
                                {assignment.due_at && (
                                  <Text style={styles.dropdownItemSubtitle}>
                                    Due: {new Date(assignment.due_at).toLocaleDateString()}
                                  </Text>
                                )}
                              </View>
                              <Ionicons
                                name={selectedAssignments.includes(assignment.id.toString()) ? "checkmark-circle" : "radio-button-off"}
                                size={22}
                                color={selectedAssignments.includes(assignment.id.toString()) ? THEME.colors.primary : THEME.colors.textSecondary}
                              />
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                )}

                {/* Files Selection */}
                {files.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Files ({files.length} available)</Text>
                    <TouchableOpacity 
                      style={[styles.dropdownHeader, showFilesDropdown && styles.dropdownHeaderExpanded]}
                      onPress={() => setShowFilesDropdown(!showFilesDropdown)}
                    >
                      <View style={styles.dropdownHeaderLeft}>
                        <Text style={styles.dropdownTitle}>
                          {selectedFiles.length > 0 
                            ? `${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''} selected` 
                            : 'Select files'}
                        </Text>
                        {selectedFiles.length > 0 && (
                          <Text style={styles.dropdownSubtitle}>
                            {selectedFiles.slice(0, 2).map(id => {
                              const file = files.find(f => f.id.toString() === id);
                              return file?.display_name;
                            }).filter(Boolean).join(', ')}{selectedFiles.length > 2 ? ` and ${selectedFiles.length - 2} more...` : ''}
                          </Text>
                        )}
                      </View>
                      <View style={styles.dropdownIconContainer}>
                        <Ionicons 
                          name={showFilesDropdown ? "chevron-up" : "chevron-down"} 
                          size={20} 
                          color={THEME.colors.primary} 
                        />
                      </View>
                    </TouchableOpacity>
                    
                    {showFilesDropdown && (
                      <View style={styles.dropdownContent}>
                        <ScrollView style={styles.dropdownScrollView} nestedScrollEnabled>
                          {files.map((file) => (
                            <TouchableOpacity
                              key={file.id}
                              style={[
                                styles.dropdownItem,
                                selectedFiles.includes(file.id.toString()) && styles.selectedDropdownItem
                              ]}
                              onPress={() => toggleSelection(file.id.toString(), selectedFiles, setSelectedFiles)}
                            >
                              <View style={styles.itemInfo}>
                                <Text style={[
                                  styles.dropdownItemTitle,
                                  selectedFiles.includes(file.id.toString()) && styles.selectedDropdownItemText
                                ]}>
                                  {file.display_name}
                                </Text>
                                <Text style={styles.dropdownItemSubtitle}>{file.content_type}</Text>
                              </View>
                              <Ionicons
                                name={selectedFiles.includes(file.id.toString()) ? "checkmark-circle" : "radio-button-off"}
                                size={22}
                                color={selectedFiles.includes(file.id.toString()) ? THEME.colors.primary : THEME.colors.textSecondary}
                              />
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                )}

                {/* Additional Information */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Additional Information</Text>
                  <Text style={styles.sectionDescription}>
                    Add any additional context, specific topics, or focus areas for the flashcards
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    multiline
                    numberOfLines={4}
                    placeholder="e.g., Focus on key concepts from chapters 3-5, include definitions and real-world examples..."
                    value={additionalInfo}
                    onChangeText={setAdditionalInfo}
                    textAlignVertical="top"
                  />
                </View>

                {/* Flashcard Count */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Number of Flashcards</Text>
                  <TextInput
                    style={styles.numberInput}
                    value={flashcardCount}
                    onChangeText={setFlashcardCount}
                    placeholder="10"
                    keyboardType="numeric"
                    maxLength={2}
                  />
                </View>

                {/* Flashcard Set Configuration */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Flashcard Set (Optional)</Text>
                  <Text style={styles.sectionDescription}>
                    Create a named flashcard set with automated practice reminders
                  </Text>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Set Name</Text>
                    <TextInput
                      style={styles.textInput}
                      value={flashcardSetName}
                      onChangeText={setFlashcardSetName}
                      placeholder="e.g., Biology Chapter 5, Math Finals Review"
                      multiline={false}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Description (Optional)</Text>
                    <TextInput
                      style={[styles.textInput, { minHeight: 60 }]}
                      value={flashcardSetDescription}
                      onChangeText={setFlashcardSetDescription}
                      placeholder="Brief description of what this set covers"
                      multiline
                      numberOfLines={2}
                      textAlignVertical="top"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Practice Frequency</Text>
                    <TouchableOpacity 
                      style={styles.selector}
                      onPress={() => setShowFrequencyModal(true)}
                    >
                      <Text style={[styles.selectorText, { color: THEME.colors.text }]}>
                        {getPracticeFrequencyLabel(practiceFrequency, customFrequencyDays)}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color={THEME.colors.textSecondary} />
                    </TouchableOpacity>
                    
                    {practiceFrequency === 'custom' && (
                      <View style={styles.customFrequencyRow}>
                        <Text style={styles.customFrequencyLabel}>Practice every</Text>
                        <TextInput
                          style={[styles.numberInput, { width: 60 }]}
                          value={customFrequencyDays}
                          onChangeText={setCustomFrequencyDays}
                          placeholder="7"
                          keyboardType="numeric"
                          maxLength={2}
                        />
                        <Text style={styles.customFrequencyLabel}>days</Text>
                      </View>
                    )}
                  </View>
                </View>
              </>
            )}

            {/* Generate Button */}
            <View style={styles.generateSection}>
              <TouchableOpacity
                style={[styles.generateButton, !canGenerate && styles.generateButtonDisabled]}
                onPress={generateFlashcards}
                disabled={!canGenerate}
              >
                {isGenerating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="flash" size={24} color="#fff" />
                )}
                <Text style={styles.generateButtonText}>
                  {isGenerating ? 'Generating Flashcards...' : 'Generate Flashcards'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* Course Selection Modal */}
      <Modal
        visible={showCourseModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCourseModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Course</Text>
            <View style={styles.modalSpacer} />
          </View>
          
          <FlatList
            data={courses}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.courseItem}
                onPress={() => handleCourseSelect(item)}
              >
                <View>
                  <Text style={styles.courseItemTitle}>{item.name}</Text>
                  <Text style={styles.courseItemSubtitle}>
                    {item.course_code} • ID: {item.id}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={THEME.colors.textSecondary} />
              </TouchableOpacity>
            )}
            style={styles.coursesList}
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No courses found</Text>
                <Text style={styles.emptyStateSubtext}>
                  Make sure you are connected to Canvas and enrolled in courses
                </Text>
              </View>
            )}
          />
        </SafeAreaView>
      </Modal>

      {/* Frequency Selection Modal */}
      <Modal
        visible={showFrequencyModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowFrequencyModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Practice Frequency</Text>
            <View style={styles.modalSpacer} />
          </View>
          
          <FlatList
            data={getFrequencyOptions()}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.frequencyItem,
                  practiceFrequency === item.value && styles.selectedFrequencyItem
                ]}
                onPress={() => {
                  setPracticeFrequency(item.value);
                  setShowFrequencyModal(false);
                }}
              >
                <Text style={[
                  styles.frequencyItemTitle,
                  practiceFrequency === item.value && styles.selectedFrequencyItemText
                ]}>
                  {item.label}
                </Text>
                {practiceFrequency === item.value && (
                  <Ionicons name="checkmark" size={20} color={THEME.colors.primary} />
                )}
              </TouchableOpacity>
            )}
            style={styles.frequencyList}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.md,
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  backButton: {
    width: 40,
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: THEME.fontSize.lg,
    fontWeight: 'bold',
    color: THEME.colors.text,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: THEME.spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: THEME.spacing.md,
  },
  loadingText: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.textSecondary,
    marginLeft: THEME.spacing.sm,
  },
  section: {
    marginTop: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
  },
  sectionTitle: {
    fontSize: THEME.fontSize.lg,
    fontWeight: 'bold',
    color: THEME.colors.text,
    marginBottom: THEME.spacing.sm,
  },
  sectionDescription: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textSecondary,
    marginBottom: THEME.spacing.sm,
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  selectorText: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.textSecondary,
  },
  selectedText: {
    color: THEME.colors.text,
    fontWeight: '600',
  },
  courseCode: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textSecondary,
    marginTop: THEME.spacing.sm,
  },
  itemsList: {
    gap: THEME.spacing.sm,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  selectedItem: {
    borderColor: THEME.colors.primary,
    backgroundColor: `${THEME.colors.primary}10`,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text,
    fontWeight: '600',
  },
  itemSubtitle: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textSecondary,
    marginTop: THEME.spacing.xs,
  },
  textInput: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text,
    minHeight: 100,
  },
  numberInput: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text,
    width: 80,
  },
  generateSection: {
    marginTop: THEME.spacing.xl,
    marginBottom: THEME.spacing.xl,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.primary,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.lg,
    gap: THEME.spacing.sm,
  },
  generateButtonDisabled: {
    backgroundColor: THEME.colors.textSecondary,
    opacity: 0.6,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: THEME.fontSize.md,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  modalCancel: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.primary,
  },
  modalTitle: {
    fontSize: THEME.fontSize.lg,
    fontWeight: 'bold',
    color: THEME.colors.text,
  },
  modalSpacer: {
    width: 50,
  },
  coursesList: {
    flex: 1,
  },
  courseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.lg,
    marginHorizontal: THEME.spacing.lg,
    marginVertical: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.lg,
  },
  courseItemTitle: {
    fontSize: THEME.fontSize.md,
    fontWeight: '600',
    color: THEME.colors.text,
    marginBottom: THEME.spacing.xs,
  },
  courseItemSubtitle: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: THEME.spacing.xl * 2,
    paddingHorizontal: THEME.spacing.lg,
  },
  emptyStateText: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    marginBottom: THEME.spacing.sm,
  },
  emptyStateSubtext: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: THEME.spacing.md,
  },
  inputLabel: {
    fontSize: THEME.fontSize.sm,
    fontWeight: '600',
    color: THEME.colors.text,
    marginBottom: THEME.spacing.xs,
  },
  customFrequencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: THEME.spacing.sm,
    gap: THEME.spacing.sm,
  },
  customFrequencyLabel: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text,
  },
  frequencyList: {
    flex: 1,
  },
  frequencyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.lg,
    marginHorizontal: THEME.spacing.lg,
    marginVertical: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.lg,
  },
  selectedFrequencyItem: {
    backgroundColor: THEME.colors.primary + '20',
    borderWidth: 1,
    borderColor: THEME.colors.primary,
  },
  frequencyItemTitle: {
    fontSize: THEME.fontSize.md,
    fontWeight: '600',
    color: THEME.colors.text,
  },
  selectedFrequencyItemText: {
    color: THEME.colors.primary,
  },
  
  // Dropdown styles
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 2,
    borderColor: THEME.colors.border,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownHeaderExpanded: {
    borderColor: THEME.colors.primary,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
  },
  dropdownHeaderLeft: {
    flex: 1,
  },
  dropdownTitle: {
    fontSize: THEME.fontSize.md,
    fontWeight: '600',
    color: THEME.colors.text,
    marginBottom: THEME.spacing.xs,
  },
  dropdownSubtitle: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textSecondary,
    lineHeight: 18,
  },
  dropdownIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownContent: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderWidth: 2,
    borderColor: THEME.colors.primary,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border + '50',
    maxHeight: 280,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownScrollView: {
    maxHeight: 260,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border + '30',
  },
  selectedDropdownItem: {
    backgroundColor: THEME.colors.primary + '15',
    borderLeftWidth: 4,
    borderLeftColor: THEME.colors.primary,
  },
  dropdownItemTitle: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text,
    fontWeight: '500',
    marginBottom: THEME.spacing.xs,
    lineHeight: 20,
  },
  selectedDropdownItemText: {
    color: THEME.colors.primary,
    fontWeight: '600',
  },
  dropdownItemSubtitle: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textSecondary,
    lineHeight: 16,
  },
  dropdownNote: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    padding: THEME.spacing.md,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    backgroundColor: THEME.colors.background,
  },
});