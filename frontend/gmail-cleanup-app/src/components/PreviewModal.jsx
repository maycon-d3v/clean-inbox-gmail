import { useState, useEffect } from 'react';
import './PreviewModal.css';

function PreviewModal({ isOpen, onClose, onConfirm, groups, loading, category }) {
  const [selectedGroups, setSelectedGroups] = useState({});
  const [searchFilter, setSearchFilter] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});

  useEffect(() => {
    if (groups && groups.length > 0) {
      const initialSelection = {};
      const initialExpanded = {};

      groups.forEach(group => {
        initialSelection[group.groupName] = group.selected;
        initialExpanded[group.category] = true; // All categories expanded by default
      });

      setSelectedGroups(initialSelection);
      setExpandedCategories(initialExpanded);
    }
  }, [groups]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleToggleGroup = (groupName) => {
    setSelectedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleSelectAllInCategory = (category, value) => {
    const categoryGroups = getGroupsByCategory()[category] || [];
    const newSelection = { ...selectedGroups };

    categoryGroups.forEach(group => {
      newSelection[group.groupName] = value;
    });

    setSelectedGroups(newSelection);
  };

  const getGroupsByCategory = () => {
    if (!groups) return {};

    const categorized = {};
    groups.forEach(group => {
      if (!categorized[group.category]) {
        categorized[group.category] = [];
      }
      categorized[group.category].push(group);
    });

    return categorized;
  };

  const getFilteredGroupsInCategory = (categoryGroups) => {
    if (!searchFilter.trim()) return categoryGroups;

    return categoryGroups.filter(group =>
      group.groupName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (group.description && group.description.toLowerCase().includes(searchFilter.toLowerCase()))
    );
  };

  const highlightText = (text, search) => {
    if (!search.trim()) return text;

    const parts = text.split(new RegExp(`(${search})`, 'gi'));
    return (
      <>
        {parts.map((part, index) =>
          part.toLowerCase() === search.toLowerCase() ? (
            <mark key={index} className="highlight">{part}</mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const getSelectedCount = () => {
    if (!groups) return 0;
    return groups.reduce((total, group) => {
      return total + (selectedGroups[group.groupName] ? group.count : 0);
    }, 0);
  };

  const getCategorySelectedCount = (category) => {
    const categoryGroups = getGroupsByCategory()[category] || [];
    return categoryGroups.reduce((total, group) => {
      return total + (selectedGroups[group.groupName] ? group.count : 0);
    }, 0);
  };

  const getCategoryTotalCount = (category) => {
    const categoryGroups = getGroupsByCategory()[category] || [];
    return categoryGroups.reduce((total, group) => total + group.count, 0);
  };

  const isCategoryFullySelected = (category) => {
    const categoryGroups = getGroupsByCategory()[category] || [];
    return categoryGroups.every(group => selectedGroups[group.groupName]);
  };

  const handleConfirm = () => {
    const selectedMessageIds = groups
      .filter(group => selectedGroups[group.groupName])
      .flatMap(group => group.messageIds);

    onConfirm(selectedMessageIds);
  };

  const getCategoryLabel = (category) => {
    const labels = {
      unread: 'Unread Emails',
      spam: 'Spam',
      trash: 'Trash',
      old: 'Old Emails'
    };
    return labels[category] || category;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      unread: 'bx-envelope',
      spam: 'bx-error',
      trash: 'bx-trash',
      old: 'bx-time'
    };
    return icons[category] || 'bx-folder';
  };

  const getCategoryColor = (category) => {
    const colors = {
      unread: '#3b82f6',
      spam: '#ef4444',
      trash: '#f59e0b',
      old: '#8b5cf6'
    };
    return colors[category] || '#6366f1';
  };

  const groupsByCategory = getGroupsByCategory();

  return (
    <div className="preview-modal-backdrop" onClick={handleBackdropClick}>
      <div className="preview-modal-container">
        <div className="preview-modal-header">
          <div className="preview-header-content">
            <div className="preview-icon">
              <i className='bx bx-list-ul'></i>
            </div>
            <div>
              <h2>Preview Emails</h2>
              <p>Review and select which groups to delete</p>
            </div>
          </div>
          <button className="preview-close-btn" onClick={onClose}>
            <i className='bx bx-x'></i>
          </button>
        </div>

        <div className="preview-modal-body">
          {loading ? (
            <div className="preview-loading">
              <div className="preview-spinner"></div>
              <p>Analyzing your emails...</p>
              <p className="loading-subtitle">This may take a few moments</p>
            </div>
          ) : groups && groups.length > 0 ? (
            <>
              <div className="preview-search-bar">
                <i className='bx bx-search'></i>
                <input
                  type="text"
                  placeholder="Search by sender or email..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                />
                {searchFilter && (
                  <button className="clear-search" onClick={() => setSearchFilter('')}>
                    <i className='bx bx-x'></i>
                  </button>
                )}
              </div>

              <div className="preview-global-info">
                <div className="global-count">
                  <i className='bx bx-check-circle'></i>
                  <span>{getSelectedCount()} emails selected</span>
                </div>
              </div>

              <div className="preview-categories">
                {Object.keys(groupsByCategory).map(cat => {
                  const categoryGroups = groupsByCategory[cat];
                  const filteredGroups = getFilteredGroupsInCategory(categoryGroups);
                  const isExpanded = expandedCategories[cat];
                  const isFullySelected = isCategoryFullySelected(cat);

                  return (
                    <div key={cat} className="category-section">
                      <div className="category-header">
                        <button
                          className="category-toggle"
                          onClick={() => toggleCategory(cat)}
                        >
                          <i className={`bx ${isExpanded ? 'bx-chevron-down' : 'bx-chevron-right'}`}></i>
                          <div className="category-icon" style={{ background: `${getCategoryColor(cat)}20`, color: getCategoryColor(cat) }}>
                            <i className={`bx ${getCategoryIcon(cat)}`}></i>
                          </div>
                          <span className="category-name">{getCategoryLabel(cat)}</span>
                          <span className="category-count">{getCategorySelectedCount(cat)}/{getCategoryTotalCount(cat)} emails</span>
                        </button>
                        <div className="category-actions">
                          <label className="category-checkbox" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isFullySelected}
                              onChange={(e) => handleSelectAllInCategory(cat, e.target.checked)}
                            />
                            <span>Select all</span>
                          </label>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="category-groups">
                          {filteredGroups.length > 0 ? (
                            filteredGroups.map((group, index) => (
                              <label key={index} className="preview-group-card">
                                <input
                                  type="checkbox"
                                  checked={selectedGroups[group.groupName] || false}
                                  onChange={() => handleToggleGroup(group.groupName)}
                                />
                                <div className="preview-group-content">
                                  <div className="preview-group-icon" style={{ background: `${getCategoryColor(cat)}20`, color: getCategoryColor(cat) }}>
                                    <i className='bx bx-envelope'></i>
                                  </div>
                                  <div className="preview-group-info">
                                    <h4>{highlightText(group.groupName, searchFilter)}</h4>
                                    <p>{highlightText(group.description || `${group.count} emails`, searchFilter)}</p>
                                  </div>
                                  <div className="preview-group-count">
                                    <span className="count-badge" style={{ background: getCategoryColor(cat) }}>{group.count}</span>
                                  </div>
                                </div>
                              </label>
                            ))
                          ) : (
                            <div className="preview-empty-category">
                              <i className='bx bx-search-alt'></i>
                              <p>No results found for "{searchFilter}"</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="preview-empty">
              <i className='bx bx-inbox'></i>
              <p>No emails found to preview</p>
            </div>
          )}
        </div>

        <div className="preview-modal-footer">
          <button className="preview-button cancel" onClick={onClose}>
            <i className='bx bx-x'></i>
            Cancel
          </button>
          <button
            className="preview-button confirm danger"
            onClick={handleConfirm}
            disabled={getSelectedCount() === 0}
          >
            <i className='bx bx-trash'></i>
            Delete {getSelectedCount()} Emails
          </button>
        </div>
      </div>
    </div>
  );
}

export default PreviewModal;
