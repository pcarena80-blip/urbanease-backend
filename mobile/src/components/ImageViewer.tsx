import React from 'react';
import { Modal, View, Image, TouchableOpacity, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface ImageViewerProps {
    image: string | null;
    onClose: () => void;
}

export default function ImageViewer({ image, onClose }: ImageViewerProps) {
    if (!image) return null;

    return (
        <Modal
            visible={!!image}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <X size={32} color="white" />
                </TouchableOpacity>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    maximumZoomScale={3}
                    minimumZoomScale={1}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                >
                    <Image
                        source={{ uri: image }}
                        style={styles.image}
                        resizeMode="contain"
                        onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
                    />
                </ScrollView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
        padding: 10,
    },
    scrollContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: width,
        height: height * 0.8,
    },
});
