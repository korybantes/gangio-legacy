'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Category {
  id: string;
  name: string;
  serverId: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice' | 'video';
  serverId: string;
  categoryId: string;
  position: number;
}

interface CategoryManagementProps {
  serverId: string;
  userId: string; // Current user ID for checking permissions
}

// Sortable Category Item
function SortableCategory({ category, onEdit, onDelete, onAddChannel, disabled, children }: {
  category: Category;
  onEdit: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onAddChannel: (categoryId: string) => void;
  disabled: boolean;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
    disabled
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  };
  
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="mb-4"
    >
      <div className="bg-gray-800/80 backdrop-blur-sm rounded-lg border border-gray-700 overflow-hidden shadow-lg">
        <div 
          className="bg-gray-700/60 p-3 flex items-center justify-between cursor-grab" 
          {...attributes} 
          {...listeners}
        >
          <span className="font-medium text-gray-200">{category.name}</span>
          <div className="flex space-x-2">
            <button 
              className="p-1 text-gray-400 hover:text-white transition-colors"
              onClick={() => onEdit(category.id, category.name)}
              disabled={disabled}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
            <button 
              className="p-1 text-gray-400 hover:text-red-400 transition-colors"
              onClick={() => onDelete(category.id)}
              disabled={disabled}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
            <button 
              className="p-1 text-gray-400 hover:text-emerald-400 transition-colors"
              onClick={() => onAddChannel(category.id)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        <div className="p-2">
          {children}
        </div>
      </div>
    </div>
  );
}

// Sortable Channel Item
function SortableChannel({ channel, onEdit, onDelete }: {
  channel: Channel;
  onEdit: (id: string, name: string, type: 'text' | 'voice' | 'video') => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: channel.id
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  
  const getChannelIcon = () => {
    switch (channel.type) {
      case 'text':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
        );
      case 'voice':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
          </svg>
        );
      case 'video':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
          </svg>
        );
    }
  };
  
  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className="bg-gray-800 hover:bg-gray-750 mb-1 p-3 rounded-md flex items-center justify-between cursor-grab"
      {...attributes} 
      {...listeners}
    >
      <div className="flex items-center">
        {getChannelIcon()}
        <span>{channel.name}</span>
      </div>
      <div className="flex space-x-2">
        <button 
          className="p-1 text-gray-400 hover:text-white transition-colors"
          onClick={() => onEdit(channel.id, channel.name, channel.type)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </button>
        <button 
          className="p-1 text-gray-400 hover:text-red-400 transition-colors"
          onClick={() => onDelete(channel.id)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export const CategoryManagement: React.FC<CategoryManagementProps> = ({ serverId, userId }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newChannelName, setNewChannelName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [newChannelType, setNewChannelType] = useState<'text' | 'voice' | 'video'>('text');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ type: 'category' | 'channel'; id: string } | null>(null);
  const [editChannel, setEditChannel] = useState<Channel | null>(null);
  
  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Fetch categories and channels
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch categories
        const categoriesResponse = await fetch(`/api/servers/${serverId}/categories`);
        if (!categoriesResponse.ok) {
          throw new Error('Failed to fetch categories');
        }
        
        // Fetch channels
        const channelsResponse = await fetch(`/api/servers/${serverId}/channels`);
        if (!channelsResponse.ok) {
          throw new Error('Failed to fetch channels');
        }
        
        const categoriesData = await categoriesResponse.json();
        const channelsData = await channelsResponse.json();
        
        console.log('Categories data:', categoriesData);
        console.log('Channels data:', channelsData);
        
        // Extract categories and sort by position
        const categoriesArray = categoriesData.categories || [];
        const sortedCategories = categoriesArray.sort((a: Category, b: Category) => 
          a.position - b.position
        );
        
        // Extract channels and sort by position within category
        const channelsArray = channelsData.channels || [];
        const sortedChannels = channelsArray.sort((a: Channel, b: Channel) => 
          a.position - b.position
        );
        
        setCategories(sortedCategories);
        setChannels(sortedChannels);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [serverId]);

  // Create new category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCategoryName.trim()) {
      return;
    }
    
    try {
      setIsUpdating(true);
      
      const response = await fetch(`/api/servers/${serverId}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCategoryName,
          userId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create category');
      }
      
      const data = await response.json();
      
      // Add new category to state
      setCategories(prev => [...prev, data.category]);
      setNewCategoryName('');
      
      // Show success message
      setSuccessMessage('Category created successfully!');
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err) {
      console.error('Error creating category:', err);
      setError(err instanceof Error ? err.message : 'Failed to create category');
    } finally {
      setIsUpdating(false);
    }
  };

  // Edit category
  const handleEditCategory = async (categoryId: string, newName: string) => {
    if (!newName.trim()) {
      return;
    }
    
    try {
      setIsUpdating(true);
      
      const response = await fetch(`/api/servers/${serverId}/categories`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categoryId,
          name: newName,
          userId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update category');
      }
      
      const data = await response.json();
      
      // Update category in state
      setCategories(prev => prev.map(cat => 
        cat.id === categoryId ? data.category : cat
      ));
      
      // Show success message
      setSuccessMessage('Category updated successfully!');
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating category:', err);
      setError(err instanceof Error ? err.message : 'Failed to update category');
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete category
  const handleDeleteCategory = async (categoryId: string) => {
    try {
      setIsUpdating(true);
      
      const response = await fetch(`/api/servers/${serverId}/categories?categoryId=${categoryId}&userId=${userId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete category');
      }
      
      // Remove category from state
      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
      
      // Show success message
      setSuccessMessage('Category deleted successfully!');
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err) {
      console.error('Error deleting category:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete category');
    } finally {
      setIsUpdating(false);
    }
  };

  // Create new channel
  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newChannelName.trim() || !selectedCategoryId) {
      return;
    }
    
    try {
      setIsUpdating(true);
      
      const response = await fetch(`/api/servers/${serverId}/channels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newChannelName,
          type: newChannelType,
          categoryId: selectedCategoryId,
          userId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create channel');
      }
      
      const data = await response.json();
      
      // Add new channel to state
      setChannels(prev => [...prev, data.channel]);
      setNewChannelName('');
      
      // Show success message
      setSuccessMessage('Channel created successfully!');
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err) {
      console.error('Error creating channel:', err);
      setError(err instanceof Error ? err.message : 'Failed to create channel');
    } finally {
      setIsUpdating(false);
    }
  };

  // Edit channel handler
  const handleEditChannel = async (channelId: string, newName: string, newType: 'text' | 'voice' | 'video') => {
    try {
      setIsUpdating(true);
      
      const response = await fetch(`/api/servers/${serverId}/channels/${channelId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newName,
          type: newType,
          userId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update channel');
      }
      
      const data = await response.json();
      
      // Update channel in state
      setChannels(prev => prev.map(ch => 
        ch.id === channelId ? {...ch, name: newName, type: newType} : ch
      ));
      
      // Reset edit state
      setEditChannel(null);
      
      // Show success message
      setSuccessMessage('Channel updated successfully');
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating channel:', err);
      setError(err instanceof Error ? err.message : 'Failed to update channel');
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Delete channel handler
  const handleDeleteChannel = async (channelId: string) => {
    try {
      setIsUpdating(true);
      
      const response = await fetch(`/api/servers/${serverId}/channels/${channelId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete channel');
      }
      
      // Remove channel from state
      setChannels(prev => prev.filter(ch => ch.id !== channelId));
      
      // Reset confirmation state
      setDeleteConfirmation(null);
      
      // Show success message
      setSuccessMessage('Channel deleted successfully');
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err) {
      console.error('Error deleting channel:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete channel');
    } finally {
      setIsUpdating(false);
    }
  };

  // Update category positions on server
  const updateCategoryPositions = async (updatedCategories: Category[]) => {
    try {
      await fetch(`/api/servers/${serverId}/categories/positions`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categories: updatedCategories.map(cat => ({
            id: cat.id,
            position: cat.position
          })),
          userId
        }),
      });
    } catch (err) {
      console.error('Error updating category positions:', err);
    }
  };
  
  // Update channel positions on server
  const updateChannelPositions = async (updatedChannels: Channel[]) => {
    try {
      await fetch(`/api/servers/${serverId}/channels/positions`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channels: updatedChannels.map(ch => ({
            id: ch.id,
            position: ch.position
          })),
          userId
        }),
      });
    } catch (err) {
      console.error('Error updating channel positions:', err);
    }
  };

  // Handle drag end for categories
  const handleCategoryDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }
    
    setCategories(prev => {
      const oldIndex = prev.findIndex(cat => cat.id === active.id);
      const newIndex = prev.findIndex(cat => cat.id === over.id);
      
      const newOrder = arrayMove(prev, oldIndex, newIndex);
      
      // Update positions
      const updatedCategories = newOrder.map((cat, index) => ({
        ...cat,
        position: index
      }));
      
      // Save new positions to server
      updateCategoryPositions(updatedCategories);
      
      return updatedCategories;
    });
  };
  
  // Handle drag end for channels
  const handleChannelDragEnd = (event: DragEndEvent, categoryId: string) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }
    
    setChannels(prev => {
      // Get only channels in this category
      const categoryChannels = prev.filter(ch => ch.categoryId === categoryId);
      
      const oldIndex = categoryChannels.findIndex(ch => ch.id === active.id);
      const newIndex = categoryChannels.findIndex(ch => ch.id === over.id);
      
      const reorderedCategoryChannels = arrayMove(categoryChannels, oldIndex, newIndex);
      
      // Update positions within category
      const updatedCategoryChannels = reorderedCategoryChannels.map((ch, index) => ({
        ...ch,
        position: index
      }));
      
      // Replace only the channels that were in this category
      const updatedAllChannels = prev.map(ch => {
        if (ch.categoryId === categoryId) {
          const updatedChannel = updatedCategoryChannels.find(uch => uch.id === ch.id);
          return updatedChannel || ch;
        }
        return ch;
      });
      
      // Save new positions to server
      updateChannelPositions(updatedCategoryChannels);
      
      return updatedAllChannels;
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <motion.div 
          className="h-12 w-12 rounded-full border-t-4 border-b-4 border-emerald-500"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/20 border border-red-500/40 rounded-md text-white">
        <h3 className="font-bold mb-2">Error</h3>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 px-3 py-1 bg-gray-700/70 hover:bg-gray-600/70 rounded-md transition-colors text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Category Management</h2>
      </div>
      
      {updateSuccess && (
        <motion.div
          className="p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-md text-emerald-300"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p>{successMessage}</p>
          </div>
        </motion.div>
      )}
      
      {/* Confirmation Dialog */}
      <AnimatePresence>
        {deleteConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
            >
              <h3 className="text-lg font-medium text-white mb-3">Confirm Deletion</h3>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete this {deleteConfirmation.type}? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
                  onClick={() => setDeleteConfirmation(null)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded"
                  onClick={() => {
                    if (deleteConfirmation.type === 'category') {
                      handleDeleteCategory(deleteConfirmation.id);
                    } else {
                      handleDeleteChannel(deleteConfirmation.id);
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Edit Channel Dialog */}
      <AnimatePresence>
        {editChannel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
            >
              <h3 className="text-lg font-medium text-white mb-3">Edit Channel</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (editChannel) {
                  handleEditChannel(editChannel.id, editChannel.name, editChannel.type);
                }
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Channel Name
                    </label>
                    <input
                      type="text"
                      value={editChannel.name}
                      onChange={(e) => setEditChannel({...editChannel, name: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Channel Type
                    </label>
                    <select
                      value={editChannel.type}
                      onChange={(e) => setEditChannel({...editChannel, type: e.target.value as 'text' | 'voice' | 'video'})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    >
                      <option value="text">Text</option>
                      <option value="voice">Voice</option>
                      <option value="video">Video</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
                    onClick={() => setEditChannel(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded"
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700/50 shadow-xl overflow-hidden relative">
        {/* Glassmorphism effects */}
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl"></div>
      
        <div className="p-4 border-b border-gray-700/50 relative z-10">
          <h3 className="font-semibold text-lg text-emerald-400">Categories & Channels</h3>
          <p className="text-sm text-gray-400">Drag and drop to reorder categories and channels</p>
        </div>
        
        <div className="p-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category List with DnD */}
            <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-4">
              <h4 className="font-medium text-white mb-3">Categories</h4>
              
              <div className="max-h-96 overflow-y-auto pt-2">
                {categories.length === 0 ? (
                  <div className="text-center py-4 text-gray-400">
                    No categories found. Create one below.
                  </div>
                ) : (
                  <DndContext 
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleCategoryDragEnd}
                  >
                    <SortableContext 
                      items={categories.map(cat => cat.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {categories.map(category => (
                        <SortableCategory
                          key={category.id}
                          category={category}
                          onEdit={handleEditCategory}
                          onDelete={(id) => setDeleteConfirmation({ type: 'category', id })}
                          onAddChannel={(id) => setSelectedCategoryId(id)}
                          disabled={isUpdating || categories.length <= 1}
                        >
                          {/* Channel list within category with DnD */}
                          <div className="space-y-1 p-1">
                            <DndContext 
                              sensors={sensors}
                              collisionDetection={closestCenter}
                              onDragEnd={(event) => handleChannelDragEnd(event, category.id)}
                            >
                              <SortableContext 
                                items={channels
                                  .filter(ch => ch.categoryId === category.id)
                                  .map(ch => ch.id)}
                                strategy={verticalListSortingStrategy}
                              >
                                {channels
                                  .filter(channel => channel.categoryId === category.id)
                                  .map(channel => (
                                    <SortableChannel 
                                      key={channel.id}
                                      channel={channel}
                                      onEdit={(id, name, type) => setEditChannel({ ...channel, name, type })}
                                      onDelete={(id) => setDeleteConfirmation({ type: 'channel', id })}
                                    />
                                  ))}
                              </SortableContext>
                            </DndContext>
                            
                            {channels.filter(channel => channel.categoryId === category.id).length === 0 && (
                              <div className="text-sm text-gray-500 italic px-2 py-1">
                                No channels in this category
                      </div>
                            )}
                    </div>
                        </SortableCategory>
                      ))}
                    </SortableContext>
                  </DndContext>
                )}
              </div>
              
              <form onSubmit={handleAddCategory} className="mt-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="New category name..."
                    className="flex-1 px-3 py-2 bg-gray-700/70 border border-gray-600/50 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    disabled={isUpdating}
                  />
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors flex items-center"
                    disabled={isUpdating || !newCategoryName.trim()}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add
                  </button>
                </div>
              </form>
            </div>
            
            {/* Channel Creation Form */}
            <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-4">
              <h4 className="font-medium text-white mb-3">Create Channel</h4>
              
              <form onSubmit={handleAddChannel} className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Category</label>
                    <select 
                      value={selectedCategoryId || ''} 
                      onChange={(e) => setSelectedCategoryId(e.target.value || null)}
                      className="w-full px-3 py-2 bg-gray-700/70 border border-gray-600/50 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      disabled={isUpdating || categories.length === 0}
                    >
                      <option value="">Select a category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </div>
                  
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Channel Name</label>
                    <input
                      type="text"
                      value={newChannelName}
                      onChange={(e) => setNewChannelName(e.target.value)}
                      placeholder="New channel name..."
                    className="w-full px-3 py-2 bg-gray-700/70 border border-gray-600/50 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      disabled={isUpdating || !selectedCategoryId}
                    />
                </div>
                    
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Channel Type</label>
                    <select
                      value={newChannelType}
                      onChange={(e) => setNewChannelType(e.target.value as 'text' | 'voice' | 'video')}
                    className="w-full px-3 py-2 bg-gray-700/70 border border-gray-600/50 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      disabled={isUpdating || !selectedCategoryId}
                    >
                      <option value="text">Text</option>
                      <option value="voice">Voice</option>
                      <option value="video">Video</option>
                    </select>
                </div>
                    
                    <button 
                      type="submit"
                  className="w-full px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-md transition-all flex items-center justify-center"
                      disabled={isUpdating || !selectedCategoryId || !newChannelName.trim()}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                  Create Channel
                    </button>
                
                {!selectedCategoryId && categories.length > 0 && (
                  <p className="text-sm text-amber-400 mt-2">
                    Please select a category first
                  </p>
                )}
                
                {categories.length === 0 && (
                  <p className="text-sm text-amber-400 mt-2">
                    Create a category before adding channels
                  </p>
                )}
              </form>
              
              {/* Visualization Preview */}
              <div className="mt-6 p-4 bg-gray-800/70 rounded-lg border border-gray-700/50">
                <h5 className="text-sm font-medium text-gray-300 mb-3">Server Structure Preview</h5>
                <div className="space-y-3">
                  {categories.map(category => (
                    <div key={category.id} className="p-2">
                      <div className="flex items-center mb-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        <span className="text-gray-200 font-medium text-sm">{category.name}</span>
                      </div>
                      <div className="pl-3 space-y-1">
                        {channels
                          .filter(channel => channel.categoryId === category.id)
                          .map(channel => (
                            <div key={channel.id} className="flex items-center text-sm text-gray-400">
                              {channel.type === 'text' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                                </svg>
                              ) : channel.type === 'voice' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                                </svg>
                              )}
                              <span>{channel.name}</span>
                            </div>
                          ))}
                          
                        {channels.filter(channel => channel.categoryId === category.id).length === 0 && (
                          <div className="text-xs text-gray-500 italic">No channels</div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {categories.length === 0 && (
                    <div className="text-center text-gray-500 py-4">
                      Server structure will appear here
                  </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 
 