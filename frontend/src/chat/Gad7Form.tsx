import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { submitGad7 } from './chatService';

interface Gad7FormProps {
    data: any;
    sessionId: string;
    onSubmitted: (aiMsg: any) => void;
}

export default function Gad7Form({ data, sessionId, onSubmitted }: Gad7FormProps) {
    const { message, gad7 } = data;
    const { questions, options } = gad7;
    
    // state for answers, default all to -1 (unanswered)
    const [answers, setAnswers] = useState<number[]>(new Array(questions.length).fill(-1));
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSelect = (questionIndex: number, value: number) => {
        if (submitted) return;
        const newAnswers = [...answers];
        newAnswers[questionIndex] = value;
        setAnswers(newAnswers);
    };

    const isAllAnswered = answers.every(a => a !== -1);

    const handleSubmit = async () => {
        if (!isAllAnswered || submitting || submitted) return;
        
        setSubmitting(true);
        try {
            const aiMsg = await submitGad7(sessionId, answers);
            setSubmitted(true);
            onSubmitted(aiMsg);
        } catch (error) {
            console.error('Failed to submit GAD-7', error);
            alert('Gagal mengirim jawaban. Silakan coba lagi.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.introMessage}>{message}</Text>
            
            {questions.map((q: any, i: number) => (
                <View key={q.id} style={styles.questionContainer}>
                    <Text style={styles.questionText}>{i + 1}. {q.text}</Text>
                    <View style={styles.optionsContainer}>
                        {options.map((opt: any) => {
                            const isSelected = answers[i] === opt.value;
                            return (
                                <TouchableOpacity 
                                    key={opt.value}
                                    style={[
                                        styles.optionButton, 
                                        isSelected && styles.optionButtonSelected,
                                        submitted && styles.optionButtonDisabled
                                    ]}
                                    onPress={() => handleSelect(i, opt.value)}
                                    disabled={submitted}
                                >
                                    <Text style={[
                                        styles.optionText, 
                                        isSelected && styles.optionTextSelected
                                    ]}>
                                        {opt.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            ))}

            <TouchableOpacity 
                style={[
                    styles.submitButton, 
                    (!isAllAnswered || submitted) && styles.submitButtonDisabled
                ]}
                onPress={handleSubmit}
                disabled={!isAllAnswered || submitting || submitted}
            >
                {submitting ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.submitButtonText}>
                        {submitted ? "Terkirim" : "Kirim Jawaban"}
                    </Text>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 15,
        marginVertical: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        width: '100%',
    },
    introMessage: {
        fontSize: 16,
        color: '#333',
        marginBottom: 15,
        fontWeight: '500',
        lineHeight: 22,
    },
    questionContainer: {
        marginBottom: 20,
    },
    questionText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#444',
        marginBottom: 10,
    },
    optionsContainer: {
        flexDirection: 'column',
    },
    optionButton: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        marginBottom: 8,
        backgroundColor: '#f9f9f9',
    },
    optionButtonSelected: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    optionButtonDisabled: {
        opacity: 0.7,
    },
    optionText: {
        fontSize: 14,
        color: '#555',
    },
    optionTextSelected: {
        color: '#fff',
        fontWeight: 'bold',
    },
    submitButton: {
        backgroundColor: '#28a745',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    submitButtonDisabled: {
        backgroundColor: '#a5d8b2',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    }
});
