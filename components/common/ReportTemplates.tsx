import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Zap, Droplets, Thermometer, Wifi, Lightbulb, Wrench, Building, AlertTriangle } from 'lucide-react-native';

interface ReportTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  icon: any;
  color: string;
}

interface ReportTemplatesProps {
  onSelectTemplate: (template: ReportTemplate) => void;
  onClose: () => void;
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'electrical',
    title: 'Electrical Issue',
    description: 'Power outage, faulty outlets, or electrical hazards',
    category: 'Electrical',
    priority: 'high',
    icon: Zap,
    color: '#F59E0B',
  },
  {
    id: 'plumbing',
    title: 'Plumbing Problem',
    description: 'Leaky pipes, clogged drains, or water pressure issues',
    category: 'Plumbing',
    priority: 'medium',
    icon: Droplets,
    color: '#3B82F6',
  },
  {
    id: 'hvac',
    title: 'HVAC Issue',
    description: 'Heating, ventilation, or air conditioning problems',
    category: 'HVAC',
    priority: 'medium',
    icon: Thermometer,
    color: '#EF4444',
  },
  {
    id: 'internet',
    title: 'Internet/WiFi Issue',
    description: 'Poor connection, no internet access, or network problems',
    category: 'Technology',
    priority: 'low',
    icon: Wifi,
    color: '#8B5CF6',
  },
  {
    id: 'lighting',
    title: 'Lighting Problem',
    description: 'Broken bulbs, flickering lights, or insufficient lighting',
    category: 'Electrical',
    priority: 'low',
    icon: Lightbulb,
    color: '#F59E0B',
  },
  {
    id: 'maintenance',
    title: 'General Maintenance',
    description: 'Routine maintenance, repairs, or equipment servicing',
    category: 'Maintenance',
    priority: 'low',
    icon: Wrench,
    color: '#6B7280',
  },
  {
    id: 'structural',
    title: 'Structural Issue',
    description: 'Cracks, damage to walls, floors, or building structure',
    category: 'Structural',
    priority: 'high',
    icon: Building,
    color: '#DC2626',
  },
  {
    id: 'safety',
    title: 'Safety Concern',
    description: 'Safety hazards, security issues, or emergency situations',
    category: 'Safety',
    priority: 'urgent',
    icon: AlertTriangle,
    color: '#DC2626',
  },
];

export function ReportTemplates({ onSelectTemplate, onClose }: ReportTemplatesProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#DC2626';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose a Template</Text>
        <Text style={styles.subtitle}>Select a common issue type to get started quickly</Text>
      </View>

      <ScrollView style={styles.templateList} showsVerticalScrollIndicator={false}>
        {REPORT_TEMPLATES.map((template) => {
          const IconComponent = template.icon;
          return (
            <TouchableOpacity
              key={template.id}
              style={styles.templateCard}
              onPress={() => onSelectTemplate(template)}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${template.color}20` }]}>
                <IconComponent size={24} color={template.color} />
              </View>
              
              <View style={styles.templateContent}>
                <View style={styles.templateHeader}>
                  <Text style={styles.templateTitle}>{template.title}</Text>
                  <View style={[
                    styles.priorityBadge,
                    { backgroundColor: getPriorityColor(template.priority) }
                  ]}>
                    <Text style={styles.priorityText}>
                      {template.priority.toUpperCase()}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.templateDescription}>{template.description}</Text>
                <Text style={styles.templateCategory}>{template.category}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity style={styles.customButton} onPress={onClose}>
        <Text style={styles.customButtonText}>Create Custom Report</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
  },
  templateList: {
    flex: 1,
    padding: 16,
  },
  templateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  templateContent: {
    flex: 1,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  templateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  templateDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  templateCategory: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  customButton: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  customButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
});
