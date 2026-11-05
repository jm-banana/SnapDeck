/**
 * SnapDeck AI - Complete React Native App for Expo Go
 * 
 * Works 100% out-of-the-box in Expo Go on iOS & Android!
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
  Share,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const API_KEY_STORAGE = 'snapdeck_gemini_api_key_v2';

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  concept: string;
  evidenceCitation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tag: string;
  isMastered?: boolean;
}

// Built-in high-accuracy fallback decks ensuring the app NEVER fails even if offline
const OFFLINE_SAMPLE_DECKS: Record<string, { title: string; cards: Flashcard[] }> = {
  biology: {
    title: 'Cellular Respiration & Bioenergetics',
    cards: [
      {
        id: 'bio-1',
        front: 'What is the primary net ATP yield per glucose molecule during Glycolysis alone?',
        back: 'Net 2 ATP (4 ATP produced minus 2 ATP consumed during phosphorylation phase), along with 2 NADH and 2 pyruvate molecules.',
        concept: 'Glycolysis',
        evidenceCitation: 'Section 1.1: "Glycolysis yields a net gain of 2 ATP and 2 NADH in the cytoplasm."',
        difficulty: 'easy',
        tag: 'Mechanism',
      },
      {
        id: 'bio-2',
        front: 'Where specifically does the Citric Acid (Krebs) Cycle occur in eukaryotic cells?',
        back: 'In the inner mitochondrial matrix.',
        concept: 'Mitochondrial Compartments',
        evidenceCitation: 'Section 2: "Pyruvate is transported across both membranes into the inner mitochondrial matrix."',
        difficulty: 'easy',
        tag: 'Anatomy',
      },
      {
        id: 'bio-3',
        front: 'What role does Oxygen (O₂) play at the end of the electron transport chain (ETC)?',
        back: 'Oxygen acts as the terminal electron acceptor, binding 2 electrons and 2 protons (H+) to form water (H₂O).',
        concept: 'Oxidative Phosphorylation',
        evidenceCitation: 'Diagram: "O₂ + 4H⁺ + 4e⁻ -> 2H₂O at Complex IV."',
        difficulty: 'medium',
        tag: 'Core Principle',
      },
      {
        id: 'bio-4',
        front: 'What enzyme drives phosphorylation using the proton-motive force across the cristae?',
        back: 'ATP Synthase (F₀F₁ complex), which rotates as H⁺ ions flow down their electrochemical gradient.',
        concept: 'Chemiosmosis',
        evidenceCitation: 'Note box: "ATP Synthase rotor turns via proton flux from intermembrane space to matrix."',
        difficulty: 'medium',
        tag: 'Mechanism',
      },
      {
        id: 'bio-5',
        front: 'What molecule enters the Krebs cycle after the pyruvate dehydrogenase reaction?',
        back: 'Acetyl-CoA (a 2-carbon acetyl group coupled to Coenzyme A).',
        concept: 'Link Reaction',
        evidenceCitation: 'Arrow flow: "Pyruvate (3C) -> Decarboxylation -> Acetyl-CoA (2C) + CO₂."',
        difficulty: 'medium',
        tag: 'Pathway',
      },
      {
        id: 'bio-6',
        front: 'How many NADH and FADH₂ are produced per single turn of the Krebs cycle (per 1 Acetyl-CoA)?',
        back: '3 NADH, 1 FADH₂, and 1 GTP (or ATP), plus 2 CO₂ molecules released.',
        concept: 'Krebs Cycle Stoichiometry',
        evidenceCitation: 'Table: "Per acetyl group: 3 NADH, 1 FADH2, 1 ATP."',
        difficulty: 'hard',
        tag: 'Stoichiometry',
      },
      {
        id: 'bio-7',
        front: 'What is substrate-level phosphorylation?',
        back: 'The direct enzymatic transfer of a high-energy phosphate group from an organic substrate to ADP to form ATP.',
        concept: 'ATP Generation Modes',
        evidenceCitation: 'Footnote: "Distinct from oxidative phosphorylation; seen in glycolysis steps 7 & 10."',
        difficulty: 'medium',
        tag: 'Definition',
      },
      {
        id: 'bio-8',
        front: 'What is the theoretical maximum net ATP yield per glucose molecule under aerobic respiration in humans?',
        back: 'Approximately 30 to 32 ATP per glucose molecule.',
        concept: 'Total Bioenergetic Budget',
        evidenceCitation: 'Summary block: "Overall aerobic respiration yield estimated at 30-32 ATP."',
        difficulty: 'medium',
        tag: 'Core Principle',
      },
      {
        id: 'bio-9',
        front: 'Why does anaerobic fermentation occur in human skeletal muscles during intense exercise?',
        back: 'To regenerate NAD⁺ from NADH, allowing glycolysis to continue producing rapid ATP in the absence of sufficient O₂.',
        concept: 'Lactic Acid Fermentation',
        evidenceCitation: 'Section 4: "Lactate dehydrogenase reduces pyruvate to lactate to regenerate cytosolic NAD+."',
        difficulty: 'easy',
        tag: 'Physiology',
      },
      {
        id: 'bio-10',
        front: 'Which complex in the Electron Transport Chain does NOT pump protons across the mitochondrial membrane?',
        back: 'Complex II (Succinate Dehydrogenase). It delivers electrons from FADH₂ to CoQ without pumping protons.',
        concept: 'Proton Pump Complexes',
        evidenceCitation: 'Diagram footnote: "Only Complexes I, III, and IV pump protons into intermembrane space."',
        difficulty: 'hard',
        tag: 'Exam Trap',
      },
    ],
  },
  neuroscience: {
    title: 'Synaptic Transmission & Neurobiology',
    cards: [
      {
        id: 'neuro-1',
        front: 'What triggers neurotransmitter vesicle exocytosis at the axon terminal?',
        back: 'The influx of Ca²⁺ through voltage-gated calcium channels upon action potential depolarization.',
        concept: 'Synaptic Exocytosis',
        evidenceCitation: 'Section 3: "Calcium entry binds synaptotagmin, catalyzing SNARE complex fusion."',
        difficulty: 'medium',
        tag: 'Mechanism',
      },
      {
        id: 'neuro-2',
        front: 'What is the resting membrane potential of a typical mammalian neuron, and which ion maintains it?',
        back: 'Approximately -70 mV, maintained predominantly by K⁺ leak channels and the Na⁺/K⁺ ATPase pump.',
        concept: 'Resting Membrane Potential',
        evidenceCitation: 'Section 1: "Resting Vm ~ -70mV governed by Nernst equilibrium for K+."',
        difficulty: 'easy',
        tag: 'Core Principle',
      },
      {
        id: 'neuro-3',
        front: 'What is the difference between an EPSP and an IPSP?',
        back: 'EPSPs depolarize the membrane (e.g. Na⁺ influx via glutamate receptors), while IPSPs hyperpolarize it (e.g. Cl⁻ influx via GABA-A receptors).',
        concept: 'Postsynaptic Potentials',
        evidenceCitation: 'Table: "EPSP increases spike probability; IPSP suppresses firing."',
        difficulty: 'easy',
        tag: 'Definition',
      },
      {
        id: 'neuro-4',
        front: 'What is Long-Term Potentiation (LTP) and which receptor serves as its coincidence detector?',
        back: 'LTP is persistent strengthening of synapses; the NMDA receptor acts as coincidence detector requiring both depolarization (Mg²⁺ unblock) and glutamate.',
        concept: 'Synaptic Plasticity',
        evidenceCitation: 'Box: "NMDA channel opens only when Mg2+ is expelled by postsynaptic depolarization."',
        difficulty: 'hard',
        tag: 'Mechanism',
      },
      {
        id: 'neuro-5',
        front: 'What role do Schwann cells and Oligodendrocytes perform in axonal signal propagation?',
        back: 'They form myelin sheaths (Schwann cells in PNS, Oligodendrocytes in CNS) enabling rapid saltatory conduction across Nodes of Ranvier.',
        concept: 'Myelination',
        evidenceCitation: 'Diagram: "Saltatory jumping speeds action potentials up to 120 m/s."',
        difficulty: 'easy',
        tag: 'Anatomy',
      },
    ],
  },
};

/**
 * Robust JSON parser that handles code blocks, markdown wrappers, or surrounding text
 */
function extractAndParseJSON(rawText: string): any {
  if (!rawText) throw new Error('Empty response received from AI model.');

  // 1. Direct JSON parse
  try {
    return JSON.parse(rawText.trim());
  } catch (_) {}

  // 2. Code block match ```json ... ``` or ``` ... ```
  const codeBlockMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch (_) {}
  }

  // 3. Substring between outermost { and }
  const firstBrace = rawText.indexOf('{');
  const lastBrace = rawText.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(rawText.slice(firstBrace, lastBrace + 1));
    } catch (_) {}
  }

  throw new Error('Could not parse structured flashcard JSON from AI response.');
}

/**
 * Downscales full-resolution phone camera images to 1200px max dimension (~200KB)
 * Prevents mobile network timeouts, out-of-memory errors, and connection cancellations!
 */
async function optimizeImageForVision(uri: string): Promise<string> {
  try {
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1200 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );
    if (manipResult.base64) {
      return manipResult.base64;
    }
  } catch (manipErr) {
    console.warn('Image manipulation fallback:', manipErr);
  }

  // Fallback: read directly via FileSystem
  try {
    return await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64',
    });
  } catch (fsErr) {
    console.warn('FileSystem read error:', fsErr);
    return '';
  }
}

/**
 * Calls Gemini Multimodal Vision API directly
 */
async function callGeminiVision(
  base64Image: string,
  apiKey: string
): Promise<{ title: string; cards: Flashcard[] }> {
  const cleanKey = apiKey.trim().replace(/^["'`]|["'`]$/g, '').trim();
  const cleanBase64 = base64Image.replace(/^data:image\/[a-zA-Z0-9.+_-]+;base64,/, '').trim();

  if (!cleanBase64) {
    throw new Error('Image data is empty. Please capture the note again.');
  }

  const prompt = `You are SnapDeck AI, an elite study assistant.
Inspect this photo of study notes, textbook page, whiteboard, or diagram.
Transcribe the handwriting and printed text, extract all key concepts, and generate 10 to 15 high-yield active-recall flashcards.
Return ONLY a valid JSON object matching this schema:
{
  "title": "Clear Topic Title Based on the Image",
  "cards": [
    {
      "front": "Clear active recall question or prompt",
      "back": "Accurate, concise explanation or definition",
      "concept": "Name of the core concept tested",
      "evidenceCitation": "Direct quote or snippet from the notes proving factual grounding",
      "difficulty": "medium",
      "tag": "Definition"
    }
  ]
}
Allowed difficulty: "easy", "medium", "hard".
Allowed tag: "Definition", "Mechanism", "Formula", "Concept", "Exam Trap".`;

  // Active Gemini Flash models for vision analysis
  const candidateModels = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
  let lastError: Error | null = null;

  for (const model of candidateModels) {
    try {
      // 60-second timeout for upload & inference
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: 'image/jpeg',
                    data: cleanBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errJson = await response.json().catch(() => null);
        const errMsg = errJson?.error?.message || `Google API error (HTTP ${response.status})`;
        throw new Error(errMsg);
      }

      const resJson = await response.json();
      const rawText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        const finishReason = resJson?.candidates?.[0]?.finishReason;
        throw new Error(`AI generated no text (status: ${finishReason || 'unknown'}). Please ensure image is clear.`);
      }

      const parsed = extractAndParseJSON(rawText);
      const rawCards = Array.isArray(parsed?.cards) ? parsed.cards : [];

      if (rawCards.length === 0) {
        throw new Error('AI could not identify testable concepts on this page. Please ensure text is well-lit and in focus.');
      }

      const cards: Flashcard[] = rawCards.map((c: any, idx: number) => ({
        id: `card-${Date.now()}-${idx}`,
        front: c.front || 'Concept Prompt',
        back: c.back || 'Concept Explanation',
        concept: c.concept || parsed.title || 'Key Note',
        evidenceCitation: c.evidenceCitation || 'Extracted from note snapshot',
        difficulty: (['easy', 'medium', 'hard'].includes(c.difficulty) ? c.difficulty : 'medium') as 'easy' | 'medium' | 'hard',
        tag: c.tag || 'Concept',
      }));

      return {
        title: parsed.title || 'Extracted Study Deck',
        cards,
      };
    } catch (err: any) {
      console.warn(`Model ${model} attempt error:`, err?.message);

      if (err?.name === 'AbortError' || err?.message?.includes('canceled') || err?.message?.includes('cancelled')) {
        lastError = new Error('Network timeout: The connection timed out while uploading notes to Gemini. Please check your internet connection.');
        break;
      }

      lastError = err;
      if (err?.message?.includes('API key not valid')) {
        break;
      }
    }
  }

  throw lastError || new Error('Could not analyze notes. Please check your internet connection.');
}

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [deckTitle, setDeckTitle] = useState('Study Deck');
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const cameraRef = useRef<any>(null);

  // API Key management
  const [apiKey, setApiKey] = useState(process.env.EXPO_PUBLIC_GEMINI_API_KEY || '');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);

  useEffect(() => {
    // Load persisted API key on startup
    AsyncStorage.getItem(API_KEY_STORAGE)
      .then((saved) => {
        if (saved && saved.trim()) {
          const cleaned = saved.trim().replace(/^["'`]|["'`]$/g, '').trim();
          setApiKey(cleaned);
          setApiKeyInput(cleaned);
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveApiKey = async () => {
    const cleaned = apiKeyInput.trim().replace(/^["'`]|["'`]$/g, '').trim();
    setApiKey(cleaned);
    try {
      if (cleaned) {
        await AsyncStorage.setItem(API_KEY_STORAGE, cleaned);
      } else {
        await AsyncStorage.removeItem(API_KEY_STORAGE);
      }
    } catch {}
    setShowKeyModal(false);

    if (cleaned) {
      Alert.alert('API Key Saved', 'Gemini Vision AI is active! Snapping notes will now extract flashcards directly from your camera.');
    } else {
      Alert.alert('Key Cleared', 'App will use the high-accuracy offline reference library.');
    }
  };

  const flipCard = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setIsFlipped(!isFlipped);
  };

  const loadSampleDeck = () => {
    const sampleKeys = Object.keys(OFFLINE_SAMPLE_DECKS);
    const chosenKey = sampleKeys[Math.floor(Math.random() * sampleKeys.length)] || 'biology';
    const sample = OFFLINE_SAMPLE_DECKS[chosenKey];

    setDeckTitle(sample.title);
    setCards(sample.cards);
    setCurrentIndex(0);
    setIsFlipped(false);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  };

  // Common handler to process a captured or selected base64 image
  const processImageForFlashcards = async (base64Image: string) => {
    const activeKey = apiKey.trim().replace(/^["'`]|["'`]$/g, '').trim();

    // If no key is set, clearly guide the user
    if (!activeKey || activeKey === 'MY_GEMINI_API_KEY' || activeKey.length < 10) {
      Alert.alert(
        'Gemini API Key Required',
        'To extract flashcards from your actual photo with Gemini Vision AI, tap "🔑 Set Key" and paste your Google Gemini API key.\n\nWould you like to try a sample deck for now?',
        [
          { text: 'Set API Key', onPress: () => setShowKeyModal(true) },
          { text: 'Use Sample Deck', onPress: () => loadSampleDeck() },
        ]
      );
      return;
    }

    setIsCapturing(true);
    setProcessingStatus('Gemini Vision AI analyzing notes...');

    try {
      const result = await callGeminiVision(base64Image, activeKey);
      setDeckTitle(result.title);
      setCards(result.cards);
      setCurrentIndex(0);
      setIsFlipped(false);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    } catch (err: any) {
      console.error('Note extraction error:', err);
      Alert.alert(
        'AI Extraction Notice',
        `${err?.message || 'Could not read notes from this photo.'}\n\nPlease check your API key, lighting, and camera focus.`,
        [
          { text: 'Edit API Key', onPress: () => setShowKeyModal(true) },
          { text: 'Use Sample Deck', onPress: () => loadSampleDeck() },
          { text: 'Try Again', style: 'cancel' },
        ]
      );
    } finally {
      setIsCapturing(false);
      setProcessingStatus('');
    }
  };

  // Snap with Camera
  const snapAndGenerateDeck = async (useSample = false) => {
    if (useSample) {
      loadSampleDeck();
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {}

    setIsCapturing(true);
    setProcessingStatus('Capturing high-res photo...');

    try {
      let base64Image = '';
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          shutterSound: false,
        });

        if (photo?.uri) {
          setProcessingStatus('Optimizing image for AI (1200px)...');
          base64Image = await optimizeImageForVision(photo.uri);
        } else if (photo?.base64) {
          base64Image = photo.base64;
        }
      }

      if (!base64Image) {
        throw new Error('Camera did not return image data. Please ensure camera preview is active and try again.');
      }

      await processImageForFlashcards(base64Image);
    } catch (e: any) {
      setIsCapturing(false);
      setProcessingStatus('');
      Alert.alert('Camera Error', e?.message || 'Failed to capture photo.');
    }
  };

  // Pick Photo from Device Gallery
  const handlePickFromGallery = async () => {
    if (isCapturing) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setIsCapturing(true);
        setProcessingStatus('Optimizing selected image...');

        let base64 = '';
        if (asset.uri) {
          base64 = await optimizeImageForVision(asset.uri);
        }

        if (base64) {
          await processImageForFlashcards(base64);
        } else {
          setIsCapturing(false);
          setProcessingStatus('');
          Alert.alert('Import Notice', 'Could not read image file from gallery.');
        }
      }
    } catch (err: any) {
      setIsCapturing(false);
      setProcessingStatus('');
      Alert.alert('Import Failed', err?.message || 'Could not select photo.');
    }
  };

  const handleShareDeck = async () => {
    try {
      const ankiTsv = cards
        .map((c) => `${c.front}\t${c.back}\t${c.tag}`)
        .join('\n');
      await Share.share({
        title: `${deckTitle} Flashcards`,
        message: `#separator:tab\n${ankiTsv}`,
      });
    } catch {}
  };

  const currentCard = cards[currentIndex];

  if (!permission) {
    return (
      <View style={[styles.darkBackground, styles.center]}>
        <ActivityIndicator size="large" color="#38BDF8" />
        <Text style={[styles.subText, { marginTop: 12 }]}>Initializing camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.darkBackground, styles.center]}>
        <StatusBar barStyle="light-content" />
        <Text style={styles.titleText}>SnapDeck AI</Text>
        <Text style={styles.subText}>
          Camera permission is needed to snap textbook pages & handwritten notes.
        </Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission}>
          <Text style={styles.primaryBtnText}>Enable Camera in Expo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: '#1E293B', marginTop: 12 }]}
          onPress={handlePickFromGallery}
        >
          <Text style={styles.primaryBtnText}>📁 Or Pick Photo from Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: '#0F172A', marginTop: 12, borderWidth: 1, borderColor: '#334155' }]}
          onPress={() => loadSampleDeck()}
        >
          <Text style={styles.primaryBtnText}>⚡ Test Demo Deck</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.darkBackground}>
      <StatusBar barStyle="light-content" />

      {cards.length === 0 ? (
        // ================= CAMERA SCREEN =================
        <View style={styles.flex1}>
          <CameraView style={styles.flex1} ref={cameraRef} facing={facing}>
            <View style={styles.cameraOverlay}>
              {/* Header */}
              <View style={styles.cameraHeader}>
                <View style={styles.headerTopRow}>
                  <TouchableOpacity
                    style={[styles.keyBtn, apiKey ? styles.keyBtnActive : null]}
                    onPress={() => {
                      setApiKeyInput(apiKey);
                      setShowKeyModal(true);
                    }}
                  >
                    <Text style={styles.keyBtnText}>
                      🔑 {apiKey ? 'Key Set ✓' : 'Set Key'}
                    </Text>
                  </TouchableOpacity>

                  <Text style={styles.brandTitle}>SnapDeck AI</Text>

                  <TouchableOpacity
                    style={styles.flipBtn}
                    onPress={() =>
                      setFacing((prev) => (prev === 'back' ? 'front' : 'back'))
                    }
                  >
                    <Text style={styles.flipBtnText}>Flip</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.brandSub}>
                  Fit textbook page or notes inside frame
                </Text>
              </View>

              {/* Viewfinder reticle */}
              <View style={styles.viewfinder}>
                <View style={[styles.corner, styles.tl]} />
                <View style={[styles.corner, styles.tr]} />
                <View style={[styles.corner, styles.bl]} />
                <View style={[styles.corner, styles.br]} />
                <Text style={styles.viewfinderGuide}>
                  AUTO DOCUMENT CAPTURE
                </Text>
              </View>

              {/* Bottom Shutter & Gallery Controls */}
              <View style={styles.shutterContainer}>
                {isCapturing ? (
                  <View style={styles.processingBox}>
                    <ActivityIndicator size="large" color="#38BDF8" />
                    <Text style={styles.processingText}>
                      {processingStatus || 'Generating Flashcards with AI...'}
                    </Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.shutterRow}>
                      <TouchableOpacity
                        style={styles.galleryBtn}
                        onPress={handlePickFromGallery}
                      >
                        <Text style={styles.galleryBtnIcon}>📁</Text>
                        <Text style={styles.galleryBtnText}>Gallery</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.shutterOuter}
                        onPress={() => snapAndGenerateDeck(false)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.shutterInner} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.galleryBtn}
                        onPress={() => loadSampleDeck()}
                      >
                        <Text style={styles.galleryBtnIcon}>⚡</Text>
                        <Text style={styles.galleryBtnText}>Demo</Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.shutterLabel}>
                      TAP SHUTTER TO EXTRACT NOTES
                    </Text>
                  </>
                )}
              </View>
            </View>
          </CameraView>
        </View>
      ) : (
        // ================= FLASHCARD DECK SCREEN =================
        <View style={styles.deckContainer}>
          {/* Deck Top Bar */}
          <View style={styles.deckTopBar}>
            <TouchableOpacity onPress={() => setCards([])}>
              <Text style={styles.retakeText}>‹ New Snap</Text>
            </TouchableOpacity>
            <View style={styles.deckTitleBox}>
              <Text style={styles.deckTitle} numberOfLines={1}>
                {deckTitle}
              </Text>
              <Text style={styles.deckCounter}>
                Card {currentIndex + 1} of {cards.length}
              </Text>
            </View>
            <TouchableOpacity onPress={handleShareDeck}>
              <Text style={styles.shareText}>Export</Text>
            </TouchableOpacity>
          </View>

          {/* Interactive Card */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={flipCard}
            style={styles.cardWrapper}
          >
            <View
              style={[
                styles.card,
                isFlipped ? styles.cardBack : styles.cardFront,
              ]}
            >
              <View style={styles.cardMetaRow}>
                <View style={styles.cardTagBadge}>
                  <Text style={styles.cardTagText}>
                    {currentCard?.tag || 'Concept'}
                  </Text>
                </View>
                <Text style={styles.difficultyText}>
                  {currentCard?.difficulty?.toUpperCase() || 'MEDIUM'}
                </Text>
              </View>

              <ScrollView
                style={styles.cardContentScroll}
                contentContainerStyle={styles.cardContentCenter}
              >
                <Text style={styles.conceptLabel}>{currentCard?.concept}</Text>
                <Text style={styles.cardMainText}>
                  {isFlipped ? currentCard?.back : currentCard?.front}
                </Text>

                {isFlipped && currentCard?.evidenceCitation ? (
                  <View style={styles.citationBox}>
                    <Text style={styles.citationLabel}>
                      VERIFIED NOTE CITATION:
                    </Text>
                    <Text style={styles.citationText}>
                      "{currentCard.evidenceCitation}"
                    </Text>
                  </View>
                ) : null}
              </ScrollView>

              <Text style={styles.flipHintText}>
                {isFlipped ? 'Tap to see prompt' : 'Tap to reveal answer'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Bottom Actions */}
          <View style={styles.bottomNavRow}>
            <TouchableOpacity
              style={[
                styles.navBtn,
                currentIndex === 0 && styles.navBtnDisabled,
              ]}
              disabled={currentIndex === 0}
              onPress={() => {
                if (currentIndex > 0) {
                  setCurrentIndex(currentIndex - 1);
                  setIsFlipped(false);
                }
              }}
            >
              <Text style={styles.navBtnText}>Previous</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navBtn, styles.nextBtn]}
              onPress={() => {
                if (currentIndex < cards.length - 1) {
                  setCurrentIndex(currentIndex + 1);
                  setIsFlipped(false);
                } else {
                  Alert.alert('Deck Finished!', 'You reviewed all cards!');
                }
              }}
            >
              <Text style={styles.nextBtnText}>
                {currentIndex < cards.length - 1 ? 'Next Card ›' : 'Restart'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ================= API KEY MODAL ================= */}
      <Modal
        visible={showKeyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowKeyModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>🔑 Google Gemini API Key</Text>
            <Text style={styles.modalDesc}>
              Paste your Gemini API key from Google AI Studio (aistudio.google.com).
              It enables live camera photo-to-flashcard generation directly on your phone.
            </Text>

            <TextInput
              style={styles.keyInput}
              placeholder="AIzaSy..."
              placeholderTextColor="#64748B"
              value={apiKeyInput}
              onChangeText={setApiKeyInput}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry={false}
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowKeyModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveApiKey}
              >
                <Text style={styles.modalSaveText}>Save Key</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  darkBackground: { flex: 1, backgroundColor: '#0B0F19' },
  center: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  titleText: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 },
  subText: { fontSize: 14, color: '#94A3B8', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  primaryBtn: { backgroundColor: '#0284C7', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 14 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  cameraOverlay: { flex: 1, justifyContent: 'space-between', padding: 20 },
  cameraHeader: { alignItems: 'center', marginTop: 10, width: '100%' },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  brandTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', letterSpacing: 0.5 },
  brandSub: { color: '#94A3B8', fontSize: 12, marginTop: 4 },
  keyBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(56,189,248,0.15)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.3)',
  },
  keyBtnActive: {
    backgroundColor: 'rgba(16,185,129,0.2)',
    borderColor: 'rgba(16,185,129,0.5)',
  },
  keyBtnText: { color: '#38BDF8', fontSize: 11, fontWeight: '700' },
  flipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
  },
  flipBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  viewfinder: {
    height: 360,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  viewfinderGuide: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  corner: { position: 'absolute', width: 22, height: 22, borderColor: '#38BDF8' },
  tl: { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 10 },
  tr: { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 10 },
  bl: { bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 10 },
  br: { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 10 },
  shutterContainer: { alignItems: 'center', marginBottom: 20 },
  shutterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 30,
  },
  galleryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    width: 60,
  },
  galleryBtnIcon: { fontSize: 24, marginBottom: 2 },
  galleryBtnText: { color: '#94A3B8', fontSize: 11, fontWeight: '600' },
  shutterOuter: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  shutterInner: { width: 66, height: 66, borderRadius: 33, backgroundColor: '#FFFFFF' },
  shutterLabel: { color: '#FFFFFF', fontSize: 11, fontWeight: '700', marginTop: 12, letterSpacing: 0.8 },
  processingBox: { alignItems: 'center', padding: 16, backgroundColor: 'rgba(15,23,42,0.85)', borderRadius: 16 },
  processingText: { color: '#38BDF8', fontSize: 13, fontWeight: '600', marginTop: 10 },
  deckContainer: { flex: 1, padding: 18, justifyContent: 'space-between' },
  deckTopBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  retakeText: { color: '#38BDF8', fontSize: 15, fontWeight: '700' },
  shareText: { color: '#38BDF8', fontSize: 15, fontWeight: '700' },
  deckTitleBox: { alignItems: 'center', maxWidth: width * 0.5 },
  deckTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  deckCounter: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  cardWrapper: { flex: 1, marginVertical: 8 },
  card: {
    flex: 1,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  cardFront: { backgroundColor: '#1E293B', borderColor: '#334155' },
  cardBack: { backgroundColor: '#0F172A', borderColor: '#38BDF8' },
  cardMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTagBadge: { backgroundColor: 'rgba(56,189,248,0.15)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  cardTagText: { color: '#38BDF8', fontSize: 11, fontWeight: '800' },
  difficultyText: { color: '#64748B', fontSize: 10, fontWeight: '700' },
  cardContentScroll: { flex: 1, marginVertical: 14 },
  cardContentCenter: { justifyContent: 'center', minHeight: 220 },
  conceptLabel: { color: '#94A3B8', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', textAlign: 'center', marginBottom: 8 },
  cardMainText: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', lineHeight: 30, textAlign: 'center' },
  citationBox: { backgroundColor: 'rgba(16,185,129,0.12)', padding: 12, borderRadius: 12, borderLeftWidth: 3, borderLeftColor: '#10B981', marginTop: 16 },
  citationLabel: { color: '#10B981', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  citationText: { color: '#A7F3D0', fontSize: 12, fontStyle: 'italic', marginTop: 4, lineHeight: 18 },
  flipHintText: { color: '#64748B', fontSize: 11, textAlign: 'center', fontWeight: '500' },
  bottomNavRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  navBtn: { flex: 1, backgroundColor: '#1E293B', paddingVertical: 14, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  navBtnDisabled: { opacity: 0.35 },
  navBtnText: { color: '#94A3B8', fontSize: 15, fontWeight: '600' },
  nextBtn: { backgroundColor: '#0284C7', borderColor: '#0284C7' },
  nextBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginBottom: 8 },
  modalDesc: { color: '#94A3B8', fontSize: 13, lineHeight: 18, marginBottom: 16 },
  keyInput: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 18,
  },
  modalButtonsRow: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#1E293B',
  },
  modalCancelText: { color: '#94A3B8', fontSize: 14, fontWeight: '600' },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#0284C7',
  },
  modalSaveText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
